<?php

namespace Ssh\Service;

use phpseclib3\Crypt\Common\PrivateKey;
use phpseclib3\Crypt\EC;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Crypt\RSA;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class SshKeyFactory
{
    /**
     * @param 'ed25519'|'rsa' $type
     *
     * @return array{type: string, private: string, public: string, fingerprint: string}
     */
    public function generate(string $type, ?string $passphrase, string $comment): array
    {
        $key = match ($type) {
            'ed25519' => EC::createKey('Ed25519'),
            'rsa' => RSA::createKey(3072),
        };
        if (!$key instanceof PrivateKey) {
            throw new BadRequestHttpException('Не удалось создать ключ');
        }

        return $this->export($key, $type, $passphrase, $comment);
    }

    /**
     * @return array{type: string, private: string, public: string, fingerprint: string}
     */
    public function import(string $pem, ?string $passphrase, string $comment): array
    {
        try {
            $loaded = PublicKeyLoader::load($pem, null !== $passphrase && '' !== $passphrase ? $passphrase : false);
        } catch (\Throwable) {
            throw new BadRequestHttpException('Не удалось прочитать приватный ключ');
        }
        if (!$loaded instanceof PrivateKey) {
            throw new BadRequestHttpException('Нужен приватный ключ');
        }

        $public = trim($loaded->getPublicKey()->toString('OpenSSH'));
        $type = $this->typeFromPublic($public);

        return $this->export($loaded, $type, $passphrase, $comment);
    }

    /**
     * @return array{type: string, private: string, public: string, fingerprint: string}
     */
    private function export(PrivateKey $key, string $type, ?string $passphrase, string $comment): array
    {
        $public = trim($key->getPublicKey()->toString('OpenSSH'));
        $parts = preg_split('/\s+/', $public) ?: [];
        if (count($parts) >= 2) {
            $public = $parts[0].' '.$parts[1].('' !== $comment ? ' '.$comment : '');
        }
        $stored = null !== $passphrase && '' !== $passphrase ? $key->withPassword($passphrase) : $key;
        if (!$stored instanceof PrivateKey) {
            throw new BadRequestHttpException('Не удалось сохранить ключ');
        }

        return [
            'type' => $type,
            'private' => $stored->toString('OpenSSH'),
            'public' => $public,
            'fingerprint' => SshClient::fingerprint($public),
        ];
    }

    private function typeFromPublic(string $public): string
    {
        if (str_starts_with($public, 'ssh-ed25519')) {
            return 'ed25519';
        }
        if (str_starts_with($public, 'ssh-rsa')) {
            return 'rsa';
        }
        if (str_starts_with($public, 'ecdsa-')) {
            return 'ecdsa';
        }

        return 'other';
    }
}
