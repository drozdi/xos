<?php

namespace Ssh\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use phpseclib3\Net\SSH2;
use Ssh\Entity\SshConnection;
use Ssh\Entity\SshKey;
use Ssh\Repository\SshConnectionRepository;
use Ssh\Repository\SshKeyRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SshConnectionManager
{
    public function __construct(
        private readonly SshConnectionRepository $connections,
        private readonly SshKeyRepository $keys,
        private readonly EntityManagerInterface $entityManager,
        private readonly SshSecretCipher $cipher,
        private readonly SshClient $client,
        private readonly SshSessionStore $sessions,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $user): array
    {
        return array_map($this->serialize(...), $this->connections->findForUser($user));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function create(User $user, array $data): array
    {
        $payload = SshConnectionPayload::parse($data, true);
        $connection = new SshConnection($user);
        $this->apply($connection, $payload, true);
        $this->entityManager->persist($connection);
        $this->entityManager->flush();

        return $this->serialize($connection);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function update(User $user, int $id, array $data): array
    {
        $connection = $this->require($user, $id);
        $payload = SshConnectionPayload::parse($data, false);
        if ('password' === $payload['auth'] && 'password' !== $connection->getAuth() && null === $payload['secret']) {
            throw new BadRequestHttpException('Укажите пароль');
        }
        if ('key' === $payload['auth'] && null === $payload['keyId'] && !$this->hasInlineKey($connection) && null === $payload['secret']) {
            throw new BadRequestHttpException('Выберите ключ');
        }
        $hostChanged = $payload['host'] !== $connection->getHost() || $payload['port'] !== $connection->getPort();
        $this->apply($connection, $payload, false);
        if ($hostChanged) {
            $connection->setHostKeyFingerprint(null);
        }
        $this->entityManager->flush();

        return $this->serialize($connection);
    }

    public function delete(User $user, int $id): void
    {
        $connection = $this->require($user, $id);
        $this->entityManager->remove($connection);
        $this->entityManager->flush();
    }

    /**
     * @return array{id: string, columns: int, rows: int}
     */
    public function openSession(User $user, int $connectionId, bool $acceptHostKey, int $columns, int $rows): array
    {
        $connection = $this->require($user, $connectionId);
        $userId = $user->getId();
        if (null === $userId) {
            throw new NotFoundHttpException('Пользователь не найден');
        }
        $ssh = $this->client->connect($connection, $acceptHostKey, $columns, $rows);
        $fingerprint = SshClient::fingerprint((string) $ssh->getServerPublicHostKey());
        if ($connection->getHostKeyFingerprint() !== $fingerprint) {
            $connection->setHostKeyFingerprint($fingerprint);
            $this->entityManager->flush();
        }
        try {
            $ssh->disconnect();
        } catch (\Throwable) {
        }
        $meta = $this->sessions->create($userId, $connectionId, max(20, min(500, $columns)), max(5, min(200, $rows)));

        return [
            'id' => $meta['id'],
            'columns' => $meta['columns'],
            'rows' => $meta['rows'],
        ];
    }

    public function openStream(User $user, string $sessionId): SSH2
    {
        $userId = $user->getId();
        if (null === $userId) {
            throw new NotFoundHttpException('Пользователь не найден');
        }
        $meta = $this->sessions->requireForUser($userId, $sessionId);
        $connection = $this->require($user, $meta['connection_id']);

        return $this->client->connect($connection, false, $meta['columns'], $meta['rows']);
    }

    /**
     * @param array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     auth: 'password'|'key',
     *     secret: string|null,
     *     passphrase: string|null,
     *     passphraseProvided: bool,
     *     keyId: int|null,
     *     keyIdProvided: bool
     * } $payload
     */
    private function apply(SshConnection $connection, array $payload, bool $isNew): void
    {
        $connection
            ->setName($payload['name'])
            ->setHost($payload['host'])
            ->setPort($payload['port'])
            ->setUsername($payload['username'])
            ->setAuth($payload['auth']);

        if ('password' === $payload['auth']) {
            $connection->setKey(null)->setPassphrase(null);
            if (null !== $payload['secret']) {
                $connection->setSecret($this->cipher->encrypt($payload['secret']));
            } elseif ($isNew) {
                throw new BadRequestHttpException('Укажите пароль');
            }

            return;
        }

        if (null !== $payload['keyId']) {
            $connection->setKey($this->requireKey($connection->getUser(), $payload['keyId']))
                ->setSecret('')
                ->setPassphrase(null);

            return;
        }

        if ($payload['keyIdProvided']) {
            $connection->setKey(null);
        }
        if (null !== $payload['secret']) {
            $connection->setSecret($this->cipher->encrypt($payload['secret']));
        } elseif ($isNew) {
            throw new BadRequestHttpException('Выберите ключ');
        }
        if ($payload['passphraseProvided']) {
            $passphrase = $payload['passphrase'];
            $connection->setPassphrase(null === $passphrase || '' === $passphrase ? null : $this->cipher->encrypt($passphrase));
        }
    }

    private function requireKey(User $user, int $id): SshKey
    {
        $key = $this->keys->findOneForUser($user, $id);
        if (!$key instanceof SshKey) {
            throw new NotFoundHttpException('Ключ не найден');
        }

        return $key;
    }

    private function hasInlineKey(SshConnection $connection): bool
    {
        return 'key' === $connection->getAuth()
            && !$connection->getKey() instanceof SshKey
            && '' !== $connection->getSecret();
    }

    private function require(User $user, int $id): SshConnection
    {
        $connection = $this->connections->findOneForUser($user, $id);
        if (!$connection instanceof SshConnection) {
            throw new NotFoundHttpException('Подключение не найдено');
        }

        return $connection;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SshConnection $connection): array
    {
        return [
            'id' => $connection->getId(),
            'name' => $connection->getName(),
            'host' => $connection->getHost(),
            'port' => $connection->getPort(),
            'username' => $connection->getUsername(),
            'auth' => $connection->getAuth(),
            'has_secret' => '' !== $connection->getSecret(),
            'has_passphrase' => null !== $connection->getPassphrase() && '' !== $connection->getPassphrase(),
            'key_id' => $connection->getKey()?->getId(),
            'key_name' => $connection->getKey()?->getName(),
            'inline_key' => $this->hasInlineKey($connection),
            'host_key_fingerprint' => $connection->getHostKeyFingerprint(),
        ];
    }
}
