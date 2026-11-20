<?php

namespace Samba\Service;

use App\Security\UserScopeResolver;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Main\Service\AuditLogger;
use Samba\Entity\SambaServer;
use Samba\Entity\SambaServerAccess;
use Samba\Repository\SambaServerAccessRepository;
use Samba\Repository\SambaServerRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SambaServerManager
{
    public function __construct(
        private readonly SambaServerRepository $servers,
        private readonly SambaServerAccessRepository $accesses,
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserScopeResolver $scopes,
        private readonly AuditLogger $audit,
        private readonly SambaGuard $guard,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $actor): array
    {
        return array_map(fn (SambaServer $server): array => $this->serialize($actor, $server), $this->servers->findVisible($actor));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(User $actor, int $id): array
    {
        return $this->serialize($actor, $this->requireVisible($actor, $id));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function create(User $actor, array $data): array
    {
        $server = new SambaServer($actor);
        $this->fill($server, $data);
        $server->setAgentToken(bin2hex(random_bytes(24)));
        $this->entityManager->persist($server);
        $this->entityManager->flush();
        $this->audit->log('samba.server.create', 'samba_server', $server->getId(), $server->getName(), null, $actor);

        return $this->serialize($actor, $server);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function update(User $actor, int $id, array $data): array
    {
        $server = $this->requireVisible($actor, $id);
        $this->assertOwner($actor, $server);
        $this->fill($server, $data);
        $this->entityManager->flush();
        $this->audit->log('samba.server.update', 'samba_server', $server->getId(), $server->getName(), null, $actor);

        return $this->serialize($actor, $server);
    }

    /**
     * @return array<string, mixed>
     */
    public function rotateAgentToken(User $actor, int $id): array
    {
        $server = $this->requireVisible($actor, $id);
        $this->assertOwner($actor, $server);
        $server->setAgentToken(bin2hex(random_bytes(24)));
        $this->entityManager->flush();
        $this->audit->log('samba.agent_token.rotate', 'samba_server', $server->getId(), $server->getName(), null, $actor);

        return $this->serialize($actor, $server);
    }

    public function delete(User $actor, int $id): void
    {
        $server = $this->requireVisible($actor, $id);
        $this->assertOwner($actor, $server);
        $serverId = $server->getId();
        $name = $server->getName();
        $this->entityManager->remove($server);
        $this->entityManager->flush();
        $this->audit->log('samba.server.delete', 'samba_server', $serverId, $name, null, $actor);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function grant(User $actor, int $id, array $data): array
    {
        $server = $this->requireVisible($actor, $id);
        $this->assertOwner($actor, $server);
        $target = $this->user($data['user_id'] ?? null);
        if ($this->same($target, $server->getOwner())) {
            throw new BadRequestHttpException('Владельцу доступ не выдаётся');
        }
        $rights = SambaRights::parse($data['rights'] ?? null);
        $access = $this->accesses->findOneFor($server, $target);
        if (!$access instanceof SambaServerAccess) {
            $access = new SambaServerAccess($server, $target, $rights, $actor);
            $this->entityManager->persist($access);
        } else {
            $access->setRights($rights);
        }
        $this->entityManager->flush();
        $this->audit->log('samba.access.grant', 'samba_server', $server->getId(), $server->getName(), [
            'user_id' => $target->getId(),
            'rights' => SambaRights::names($rights),
        ], $actor);

        return $this->serialize($actor, $server);
    }

    public function revoke(User $actor, int $id, int $userId): void
    {
        $server = $this->requireVisible($actor, $id);
        $this->assertOwner($actor, $server);
        $target = $this->user($userId);
        $access = $this->accesses->findOneFor($server, $target);
        if (!$access instanceof SambaServerAccess) {
            throw new NotFoundHttpException('Доступ не найден');
        }
        $this->entityManager->remove($access);
        $this->entityManager->flush();
        $this->audit->log('samba.access.revoke', 'samba_server', $server->getId(), $server->getName(), [
            'user_id' => $target->getId(),
        ], $actor);
    }

    /**
     * @return array<string, mixed>
     */
    public function transfer(User $actor, int $id, int $userId): array
    {
        $server = $this->servers->find($id);
        if (!$server instanceof SambaServer || !$this->servers->isVisible($actor, $server)) {
            if (!$this->scopes->hasFullAppAccess($actor, 'samba')) {
                throw new NotFoundHttpException('Сервер не найден');
            }
            if (!$server instanceof SambaServer) {
                throw new NotFoundHttpException('Сервер не найден');
            }
        }
        if (!$this->same($actor, $server->getOwner()) && !$this->scopes->hasFullAppAccess($actor, 'samba')) {
            throw new AccessDeniedHttpException('Передать сервер может только владелец');
        }
        $next = $this->user($userId);
        if ($this->same($next, $server->getOwner())) {
            throw new BadRequestHttpException('Этот пользователь уже владелец');
        }
        $previous = $server->getOwner()->getId();
        $server->setOwner($next);
        $existing = $this->accesses->findOneFor($server, $next);
        if ($existing instanceof SambaServerAccess) {
            $this->entityManager->remove($existing);
        }
        $this->entityManager->flush();
        $this->audit->log('samba.server.transfer', 'samba_server', $server->getId(), $server->getName(), [
            'from' => $previous,
            'to' => $next->getId(),
        ], $actor);

        return $this->serialize($actor, $server);
    }

    /**
     * @return array{entries: list<mixed>}
     */
    public function log(User $actor, int $id): array
    {
        $server = $this->servers->find($id);
        if (!$server instanceof SambaServer) {
            throw new NotFoundHttpException('Сервер не найден');
        }
        if (!SambaGuard::isOwner($actor, $server)) {
            throw new AccessDeniedHttpException('Журнал читает только владелец');
        }

        return ['entries' => []];
    }

    public function assertDeletable(User $user): void
    {
        $this->guard->assertDeletable($user);
    }

    private function requireVisible(User $actor, int $id): SambaServer
    {
        $server = $this->servers->findVisibleOne($actor, $id);
        if (!$server instanceof SambaServer) {
            throw new NotFoundHttpException('Сервер не найден');
        }

        return $server;
    }

    private function assertOwner(User $actor, SambaServer $server): void
    {
        if (!$this->same($actor, $server->getOwner())) {
            throw new AccessDeniedHttpException('Это может сделать только владелец');
        }
    }

    private function user(mixed $id): User
    {
        if (!is_int($id) && !(is_string($id) && ctype_digit((string) $id))) {
            throw new BadRequestHttpException('Пользователь не указан');
        }
        $user = $this->users->find((int) $id);
        if (!$user instanceof User) {
            throw new NotFoundHttpException('Пользователь не найден');
        }

        return $user;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function fill(SambaServer $server, array $data): void
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ('' === $name || strlen($name) > 120 || 1 === preg_match('/[\x00-\x1F]/', $name)) {
            throw new BadRequestHttpException('Название заполнено неверно');
        }
        $role = (string) ($data['role'] ?? 'ad_dc');
        if ('nt4' === $role) {
            throw new BadRequestHttpException('Роль NT4 пока недоступна');
        }
        if ('ad_dc' !== $role) {
            throw new BadRequestHttpException('Роль заполнена неверно');
        }
        $file = true === ($data['file'] ?? false) || '1' === ($data['file'] ?? null);
        $zone = trim((string) ($data['expected_timezone'] ?? 'UTC'));
        if ('' === $zone || strlen($zone) > 64 || 1 === preg_match('/[\x00-\x1F]/', $zone)) {
            throw new BadRequestHttpException('Часовой пояс заполнен неверно');
        }
        $description = trim((string) ($data['description'] ?? ''));
        $server
            ->setName($name)
            ->setDescription('' === $description ? null : $description)
            ->setRole('ad_dc')
            ->setCapabilities($file ? ['dc', 'file'] : ['dc'])
            ->setExpectedTimezone($zone)
            ->setAgentUrl($this->agentUrl($data['agent_url'] ?? null));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $actor, SambaServer $server): array
    {
        $owner = $this->same($actor, $server->getOwner());
        $access = $this->accesses->findForServer($server);
        $mask = 0;
        if (!$owner) {
            $own = $this->accesses->findOneFor($server, $actor);
            $mask = $own instanceof SambaServerAccess ? $own->getRights() : 0;
        }
        $grants = [];
        if ($owner) {
            foreach ($access as $row) {
                $grants[] = [
                    'user_id' => $row->getUser()->getId(),
                    'label' => (string) ($row->getUser()->getAlias() ?: $row->getUser()->getLogin()),
                    'rights' => SambaRights::names($row->getRights()),
                ];
            }
        }

        return [
            'id' => $server->getId(),
            'name' => $server->getName(),
            'description' => $server->getDescription(),
            'role' => $server->getRole(),
            'file' => in_array('file', $server->getCapabilities(), true),
            'status' => $server->getStatus(),
            'expected_timezone' => $server->getExpectedTimezone(),
            'agent_url' => $server->getAgentUrl(),
            'agent_token_set' => null !== $server->getAgentToken() && '' !== $server->getAgentToken(),
            'owner' => $owner,
            'owner_label' => (string) ($server->getOwner()->getAlias() ?: $server->getOwner()->getLogin()),
            'can_directory' => $owner || SambaRights::has($mask, SambaRights::DIRECTORY),
            'can_manage' => $owner || SambaRights::has($mask, SambaRights::MANAGE),
            'can_shares' => $owner || SambaRights::has($mask, SambaRights::SHARES),
            'access' => $grants,
        ];
    }

    private function agentUrl(mixed $value): ?string
    {
        $url = trim((string) $value);
        if ('' === $url) {
            return null;
        }
        $parts = parse_url($url);
        if (!is_array($parts) || !in_array($parts['scheme'] ?? '', ['http', 'https'], true) || !isset($parts['host'], $parts['port']) || isset($parts['user']) || isset($parts['pass'])) {
            throw new BadRequestHttpException('Адрес агента заполнен неверно');
        }
        if (str_contains((string) $parts['host'], ' ') || ($parts['port'] < 1 || $parts['port'] > 65535)) {
            throw new BadRequestHttpException('Адрес агента заполнен неверно');
        }

        return $parts['scheme'].'://'.$parts['host'].':'.$parts['port'];
    }

    private function same(User $left, User $right): bool
    {
        if ($left === $right) {
            return true;
        }

        return null !== $left->getId() && $left->getId() === $right->getId();
    }
}
