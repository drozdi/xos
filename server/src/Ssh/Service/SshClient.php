<?php

namespace Ssh\Service;

use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Net\SSH2;
use Ssh\Entity\SshConnection;
use Ssh\Entity\SshKey;
use Ssh\Exception\SshHostKeyMismatch;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class SshClient
{
    public function __construct(private readonly SshSecretCipher $cipher)
    {
    }

    public function connect(SshConnection $connection, bool $acceptHostKey, int $columns, int $rows): SSH2
    {
        try {
            $ssh = new SSH2($connection->getHost(), $connection->getPort(), 12);
        } catch (\Throwable $error) {
            throw new BadRequestHttpException($this->connectMessage($error));
        }

        try {
            $hostKey = $ssh->getServerPublicHostKey();
        } catch (\Throwable $error) {
            throw new BadRequestHttpException($this->connectMessage($error));
        }
        if (!is_string($hostKey) || '' === $hostKey) {
            $ssh->disconnect();
            throw new BadRequestHttpException('Сервер не отдал ключ хоста');
        }

        $fingerprint = self::fingerprint($hostKey);
        $stored = $connection->getHostKeyFingerprint();
        if (null !== $stored && '' !== $stored && !hash_equals($stored, $fingerprint) && !$acceptHostKey) {
            $ssh->disconnect();
            throw new SshHostKeyMismatch($fingerprint);
        }

        $ssh->setTimeout(15);
        try {
            $ok = $this->login($ssh, $connection);
        } catch (BadRequestHttpException $error) {
            $ssh->disconnect();
            throw $error;
        } catch (\Throwable $error) {
            $ssh->disconnect();
            throw new BadRequestHttpException($this->connectMessage($error));
        }
        if (!$ok) {
            $ssh->disconnect();
            throw new BadRequestHttpException('Не удалось войти. Проверьте пользователя, пароль или ключ');
        }

        $ssh->setWindowSize(max(20, min(500, $columns)), max(5, min(200, $rows)));

        return $ssh;
    }

    public static function fingerprint(string $hostKey): string
    {
        $parts = preg_split('/\s+/', trim($hostKey)) ?: [];
        $raw = base64_decode($parts[1] ?? '', true);
        if (false === $raw || '' === $raw) {
            throw new BadRequestHttpException('Сервер не отдал ключ хоста');
        }

        return 'SHA256:'.rtrim(strtr(base64_encode(hash('sha256', $raw, true)), '+/', '-_'), '=');
    }

    private function login(SSH2 $ssh, SshConnection $connection): bool
    {
        if ('key' === $connection->getAuth()) {
            [$pem, $passphrase] = $this->privateKey($connection);
            try {
                $key = PublicKeyLoader::load($pem, $passphrase);
            } catch (\Throwable) {
                throw new BadRequestHttpException('Не удалось прочитать приватный ключ');
            }

            return $ssh->login($connection->getUsername(), $key);
        }

        return $ssh->login($connection->getUsername(), $this->cipher->decrypt($connection->getSecret()));
    }

    /**
     * @return array{0: string, 1: string|false}
     */
    private function privateKey(SshConnection $connection): array
    {
        $owned = $connection->getKey();
        if ($owned instanceof SshKey) {
            if ($owned->getUser()->getId() !== $connection->getUser()->getId()) {
                throw new BadRequestHttpException('Ключ недоступен');
            }
            $pem = $this->cipher->decrypt($owned->getPrivateKey());
            $passphrase = $owned->getPassphrase();
        } else {
            $pem = $this->cipher->decrypt($connection->getSecret());
            $passphrase = $connection->getPassphrase();
        }
        if ('' === $pem) {
            throw new BadRequestHttpException('Выберите ключ');
        }

        return [$pem, null !== $passphrase && '' !== $passphrase ? $this->cipher->decrypt($passphrase) : false];
    }

    private function connectMessage(\Throwable $error): string
    {
        $message = trim($error->getMessage());
        if ('' === $message) {
            return 'Не удалось подключиться';
        }

        return 'Не удалось подключиться: '.$message;
    }
}
