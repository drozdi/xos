<?php

namespace Ssh\Service;

use Main\Entity\User;
use Psr\Cache\CacheItemPoolInterface;
use Ssh\Entity\SshConnection;
use Ssh\Entity\SshKey;
use Ssh\Repository\SshConnectionRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

final class SshGatewayTicketService
{
    private const MAX_SESSIONS = 3;

    public function __construct(
        #[Autowire(service: 'cache.app')]
        private readonly CacheItemPoolInterface $cache,
        private readonly SshConnectionRepository $connections,
        private readonly SshSecretCipher $cipher,
        #[Autowire('%env(default::SSH_GATEWAY_SECRET)%')]
        private readonly string $gatewaySecret = '',
        #[Autowire('%env(default::SSH_GATEWAY_PUBLIC_URL)%')]
        private readonly string $publicUrl = '',
    ) {
    }

    /**
     * @return array{ticket: string, gateway_url: string|null}
     */
    public function issue(User $user, int $connectionId): array
    {
        $connection = $this->connections->findOneForUser($user, $connectionId);
        if (!$connection instanceof SshConnection) {
            throw new NotFoundHttpException('Подключение не найдено');
        }
        $userId = $user->getId();
        if (null === $userId) {
            throw new NotFoundHttpException('Пользователь не найден');
        }
        $countItem = $this->cache->getItem('ssh.sessions.'.$userId);
        $count = (int) ($countItem->get() ?? 0);
        if ($count >= self::MAX_SESSIONS) {
            throw new TooManyRequestsHttpException(60, 'Слишком много SSH-сессий');
        }
        $countItem->set($count + 1);
        $countItem->expiresAfter(3600);
        $this->cache->save($countItem);

        $ticket = bin2hex(random_bytes(16));
        $item = $this->cache->getItem('ssh.ticket.'.$ticket);
        $item->set(['user_id' => $userId, 'connection_id' => $connectionId]);
        $item->expiresAfter(30);
        $this->cache->save($item);

        $url = trim($this->publicUrl);

        return [
            'ticket' => $ticket,
            'gateway_url' => '' !== $url ? $url : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function redeem(string $ticket, string $secret): array
    {
        $this->assertSecret($secret);
        $item = $this->cache->getItem('ssh.ticket.'.$ticket);
        if (!$item->isHit()) {
            throw new NotFoundHttpException('Билет не найден');
        }
        /** @var array{user_id: int, connection_id: int} $stored */
        $stored = $item->get();
        $this->cache->deleteItem('ssh.ticket.'.$ticket);

        $connection = $this->connections->find($stored['connection_id']);
        if (!$connection instanceof SshConnection || $connection->getUser()?->getId() !== $stored['user_id']) {
            throw new NotFoundHttpException('Подключение не найдено');
        }

        $passphrase = $connection->getPassphrase();
        $key = $connection->getKey();

        return [
            'host' => $connection->getHost(),
            'port' => $connection->getPort(),
            'username' => $connection->getUsername(),
            'auth' => $connection->getAuth(),
            'password' => 'password' === $connection->getAuth() ? $this->cipher->decrypt($connection->getSecret()) : null,
            'private_key' => $this->privateKey($connection, $key),
            'passphrase' => is_string($passphrase) && '' !== $passphrase ? $this->cipher->decrypt($passphrase) : null,
            'user_id' => $stored['user_id'],
        ];
    }

    public function release(int $userId, string $secret): void
    {
        $this->assertSecret($secret);
        $item = $this->cache->getItem('ssh.sessions.'.$userId);
        $count = max(0, (int) ($item->get() ?? 0) - 1);
        $item->set($count);
        $item->expiresAfter(3600);
        $this->cache->save($item);
    }

    private function assertSecret(string $secret): void
    {
        if ('' === $this->gatewaySecret || !hash_equals($this->gatewaySecret, $secret)) {
            throw new AccessDeniedHttpException('Шлюз не авторизован');
        }
    }

    private function privateKey(SshConnection $connection, ?SshKey $key): ?string
    {
        if ('key' !== $connection->getAuth()) {
            return null;
        }
        if ($key instanceof SshKey) {
            return $this->cipher->decrypt($key->getPrivateKey());
        }
        $secret = $connection->getSecret();

        return '' !== $secret ? $this->cipher->decrypt($secret) : null;
    }
}
