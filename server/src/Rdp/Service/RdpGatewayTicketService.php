<?php

namespace Rdp\Service;

use Main\Entity\User;
use Main\Service\AuditLogger;
use Psr\Cache\CacheItemPoolInterface;
use Rdp\Entity\RdpConnection;
use Rdp\Entity\RdpNode;
use Rdp\Repository\RdpConnectionRepository;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

final class RdpGatewayTicketService
{
    private const MAX_SESSIONS = 3;

    private readonly string $gatewaySecret;
    private readonly string $publicUrl;
    private readonly string $guacdHost;

    public function __construct(
        #[Autowire(service: 'cache.app')]
        private readonly CacheItemPoolInterface $cache,
        private readonly RdpConnectionRepository $connections,
        private readonly SshSecretCipher $cipher,
        private readonly RdpHostPolicy $policy,
        private readonly AuditLogger $audit,
        #[Autowire('%env(default::RDP_GATEWAY_SECRET)%')]
        ?string $gatewaySecret = null,
        #[Autowire('%env(default::RDP_GATEWAY_PUBLIC_URL)%')]
        ?string $publicUrl = null,
        #[Autowire('%env(default::RDP_GUACD_HOST)%')]
        ?string $guacdHost = null,
    ) {
        $this->gatewaySecret = $gatewaySecret ?? '';
        $this->publicUrl = $publicUrl ?? '';
        $this->guacdHost = null !== $guacdHost && '' !== $guacdHost ? $guacdHost : '127.0.0.1';
    }

    /**
     * @return array{ticket: string, gateway_url: string|null}
     */
    public function issue(User $user, int $connectionId): array
    {
        $connection = $this->requireOwned($user, $connectionId);
        if ('' === $connection->getSecret()) {
            throw new BadRequestHttpException('Укажите пароль');
        }
        $access = $this->policy->assertAllowed($user, $connection->getHost(), 'auto');
        $this->assertSameZone($connection, $access['zone'], $access['network']?->getId());
        $userId = $user->getId();
        if (null === $userId) {
            throw new NotFoundHttpException('Пользователь не найден');
        }
        $sessions = $this->sessions($userId);
        if (count($sessions) >= self::MAX_SESSIONS) {
            throw new TooManyRequestsHttpException(60, 'Слишком много сессий рабочего стола');
        }
        $ticket = bin2hex(random_bytes(16));
        $item = $this->cache->getItem('rdp.ticket.'.$ticket);
        $item->set([
            'user_id' => $userId,
            'connection_id' => $connectionId,
            'started_at' => time(),
        ]);
        $item->expiresAfter(30);
        $this->cache->save($item);
        $sessions[] = ['connection_id' => $connectionId, 'started_at' => time(), 'host' => $connection->getHost()];
        $this->saveSessions($userId, $sessions);
        $this->audit->log('rdp.ticket', 'rdp_connection', $connectionId, $connection->getName(), [
            'host' => $connection->getHost(),
            'resolved_ip' => $access['resolved_ip'],
            'zone' => $access['zone'],
            'network' => $access['network_name'],
        ], $user);
        $url = trim($this->publicUrl);

        return ['ticket' => $ticket, 'gateway_url' => '' !== $url ? $url : null];
    }

    /**
     * @return array<string, mixed>
     */
    public function redeem(string $ticket, string $secret): array
    {
        $this->assertSecret($secret);
        $item = $this->cache->getItem('rdp.ticket.'.$ticket);
        if (!$item->isHit()) {
            throw new NotFoundHttpException('Билет не найден');
        }
        /** @var array{user_id: int, connection_id: int, started_at: int} $stored */
        $stored = $item->get();
        $this->cache->deleteItem('rdp.ticket.'.$ticket);
        $connection = $this->connections->find($stored['connection_id']);
        if (!$connection instanceof RdpConnection || $connection->getUser()->getId() !== $stored['user_id']) {
            throw new NotFoundHttpException('Подключение не найдено');
        }
        $user = $connection->getUser();
        $access = $this->policy->assertAllowed($user, $connection->getHost(), 'auto');
        $this->assertSameZone($connection, $access['zone'], $access['network']?->getId());
        $node = $access['node'];
        $clipboard = $connection->enablesClipboard() && (null === $access['network'] || $access['network']->allowsClipboard());
        $this->audit->log('rdp.redeem', 'rdp_connection', $connection->getId(), $connection->getName(), [
            'host' => $connection->getHost(),
            'resolved_ip' => $access['resolved_ip'],
            'zone' => $access['zone'],
            'network' => $access['network_name'],
            'node' => $node->getName(),
        ], $user);

        return [
            'user_id' => $stored['user_id'],
            'connection_id' => $connection->getId(),
            'host' => $connection->getHost(),
            'resolved_ip' => $access['resolved_ip'],
            'port' => $connection->getPort(),
            'username' => $connection->getUsername(),
            'password' => $this->cipher->decrypt($connection->getSecret()),
            'domain' => $connection->getDomain(),
            'security' => $connection->getSecurity(),
            'ignore_cert' => $connection->ignoresCert(),
            'width' => $connection->getWidth(),
            'height' => $connection->getHeight(),
            'dpi' => $connection->getDpi(),
            'color_depth' => $connection->getColorDepth(),
            'enable_clipboard' => $clipboard,
            'enable_audio' => $connection->enablesAudio(),
            'keyboard_layout' => $connection->getKeyboardLayout(),
            'resize_method' => $connection->getResizeMethod(),
            'zone' => $access['zone'],
            'network' => $access['network_name'],
            'node' => $this->nodePayload($node),
        ];
    }

    public function release(int $userId, string $secret, ?int $connectionId = null): void
    {
        $this->assertSecret($secret);
        $sessions = $this->sessions($userId);
        $spent = null;
        $kept = [];
        foreach ($sessions as $session) {
            $matches = null === $spent && (null === $connectionId || (int) $session['connection_id'] === $connectionId);
            if ($matches) {
                $spent = $session;
                continue;
            }
            $kept[] = $session;
        }
        $this->saveSessions($userId, $kept);
        $duration = null !== $spent ? max(0, time() - (int) $spent['started_at']) : null;
        $this->audit->log('rdp.release', 'rdp_connection', $connectionId, 'Сессия закрыта', [
            'user_id' => $userId,
            'host' => $spent['host'] ?? null,
            'duration' => $duration,
        ]);
    }

    private function assertSameZone(RdpConnection $connection, string $zone, ?int $networkId): void
    {
        if ($connection->getZoneDetected() !== $zone || $connection->getNetwork()?->getId() !== $networkId) {
            throw new AccessDeniedHttpException('Зона хоста изменилась');
        }
    }

    /**
     * @return array{host: string, port: int, tls: string, ca_fingerprint: string|null}
     */
    private function nodePayload(RdpNode $node): array
    {
        return [
            'host' => $node->isLocal() ? $this->guacdHost : $node->getEndpointHost(),
            'port' => $node->getEndpointPort(),
            'tls' => $node->getTlsMode(),
            'ca_fingerprint' => $node->getCaFingerprint(),
        ];
    }

    private function assertSecret(string $secret): void
    {
        if ('' === $this->gatewaySecret || !hash_equals($this->gatewaySecret, $secret)) {
            throw new AccessDeniedHttpException('Шлюз не авторизован');
        }
    }

    private function requireOwned(User $user, int $id): RdpConnection
    {
        $connection = $this->connections->findOneForUser($user, $id);
        if (!$connection instanceof RdpConnection) {
            throw new NotFoundHttpException('Подключение не найдено');
        }

        return $connection;
    }

    /**
     * @return list<array{connection_id: int, started_at: int, host: string}>
     */
    private function sessions(int $userId): array
    {
        $item = $this->cache->getItem('rdp.sessions.'.$userId);
        $value = $item->isHit() ? $item->get() : [];

        return is_array($value) ? array_values(array_filter($value, 'is_array')) : [];
    }

    /**
     * @param list<array{connection_id: int, started_at: int, host: string}> $sessions
     */
    private function saveSessions(int $userId, array $sessions): void
    {
        $item = $this->cache->getItem('rdp.sessions.'.$userId);
        $item->set($sessions);
        $item->expiresAfter(8 * 3600);
        $this->cache->save($item);
    }
}
