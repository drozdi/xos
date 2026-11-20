<?php

namespace Samba\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Main\Service\AuditLogger;
use Samba\Entity\SambaAgentCredential;
use Samba\Entity\SambaCommand;
use Samba\Entity\SambaEnrollment;
use Samba\Entity\SambaServer;
use Samba\Repository\SambaAgentCredentialRepository;
use Samba\Repository\SambaCommandRepository;
use Samba\Repository\SambaEnrollmentRepository;
use Samba\Repository\SambaServerRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SambaAgentService
{
    public function __construct(
        private readonly SambaServerRepository $servers,
        private readonly SambaEnrollmentRepository $enrollments,
        private readonly SambaAgentCredentialRepository $credentials,
        private readonly SambaCommandRepository $commands,
        private readonly EntityManagerInterface $entityManager,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @return array{token: string, server_id: int, expires_at: string, command: string}
     */
    public function issueEnrollment(User $actor, SambaServer $server, string $baseUrl): array
    {
        $token = trim((string) $server->getAgentToken());
        if ('' === $token) {
            $token = bin2hex(random_bytes(24));
            $server->setAgentToken($token);
        }
        $enrollment = new SambaEnrollment(
            $server,
            password_hash($token, PASSWORD_DEFAULT),
            new \DateTime('+30 minutes'),
            $actor,
        );
        $enrollment->setLookup(self::lookup($token));
        $this->entityManager->persist($enrollment);
        $this->entityManager->flush();
        $this->audit->log('samba.enrollment.issue', 'samba_server', $server->getId(), $server->getName(), null, $actor);
        $url = rtrim($baseUrl, '/');

        return [
            'token' => $token,
            'server_id' => (int) $server->getId(),
            'expires_at' => $enrollment->getExpiresAt()->format(\DateTimeInterface::ATOM),
            'command' => 'sudo XOS_URL='.$url.' SERVER_ID='.$server->getId().' ENROLL_TOKEN='.$token.' bash install.sh',
        ];
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{server_id: int, agent_secret: string, protocol: string}
     */
    public function enroll(array $data): array
    {
        $token = trim((string) ($data['token'] ?? ''));
        if ('' === $token) {
            throw new BadRequestHttpException('Секрет регистрации не указан');
        }
        $enrollment = null;
        foreach ($this->enrollments->findPendingByLookup(self::lookup($token)) as $candidate) {
            if (password_verify($token, $candidate->getTokenHash())) {
                $enrollment = $candidate;
                break;
            }
        }
        if (!$enrollment instanceof SambaEnrollment) {
            throw new AccessDeniedHttpException('Секрет регистрации недействителен');
        }
        $enrollment->markUsed();
        $secret = bin2hex(random_bytes(32));
        $server = $enrollment->getServer();
        $key = isset($data['seal_public_key']) ? trim((string) $data['seal_public_key']) : null;
        $credential = new SambaAgentCredential($server, self::lookup($secret), password_hash($secret, PASSWORD_DEFAULT), $key ?: null);
        $credential->setBearer($secret);
        $server->setStatus('enrolled');
        if (isset($data['state']) && is_array($data['state'])) {
            $server->setDetected($data['state']);
        }
        $this->entityManager->persist($credential);
        $this->entityManager->flush();

        return [
            'server_id' => (int) $server->getId(),
            'agent_secret' => $secret,
            'protocol' => '1',
        ];
    }

    public function authenticate(string $secret): ?SambaServer
    {
        foreach ($this->credentials->findActiveByLookup(self::lookup($secret)) as $credential) {
            if ($credential->getRevokedAt() instanceof \DateTimeInterface) {
                continue;
            }
            if (password_verify($secret, $credential->getSecretHash())) {
                return $credential->getServer();
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{status: string, skew_ms: int, warning: string|null}
     */
    public function heartbeat(SambaServer $server, array $data): array
    {
        $agentMs = (int) ($data['time_ms'] ?? 0);
        $skew = $agentMs > 0 ? abs((int) round(microtime(true) * 1000) - $agentMs) : 0;
        $timezone = trim((string) ($data['timezone'] ?? ''));
        $warning = null;
        if ($skew > 4 * 60 * 1000) {
            $warning = 'Часы сервера расходятся больше чем на 4 минуты';
        } elseif ($timezone !== '' && $timezone !== $server->getExpectedTimezone()) {
            $warning = 'Часовой пояс '.$timezone.' не совпадает с '.$server->getExpectedTimezone();
        } elseif (false === ($data['ntp'] ?? null)) {
            $warning = 'NTP не синхронизирован';
        }
        $server
            ->setStatus('online')
            ->setLastSeenAt(new \DateTime())
            ->setTimeSkewMs($skew)
            ->setAgentVersion(isset($data['agent_version']) ? substr((string) $data['agent_version'], 0, 32) : null)
            ->setProtocolVersion('1');
        if (isset($data['state']) && is_array($data['state'])) {
            $server->setDetected($data['state']);
        }
        $this->scheduleDirectory($server);
        $this->entityManager->flush();

        return ['status' => 'ok', 'skew_ms' => $skew, 'warning' => $warning];
    }

    /**
     * @return array{commands: list<array<string, mixed>>}
     */
    public function poll(SambaServer $server): array
    {
        $deadline = microtime(true) + 25;
        do {
            if ('disabled' === $server->getStatus()) {
                break;
            }
            $command = $this->claim($server);
            if ($command instanceof SambaCommand) {
                return ['commands' => [[
                    'id' => $command->getId(),
                    'type' => $command->getType(),
                    'args' => $command->getArgs(),
                    'sealed' => $command->getSealed(),
                ]]];
            }
            usleep(1_000_000);
        } while (microtime(true) < $deadline);

        return ['commands' => []];
    }

    /**
     * @param array<string, mixed> $data
     */
    public function result(SambaServer $server, array $data): void
    {
        $command = $this->commands->find((int) ($data['command_id'] ?? 0));
        if (!$command instanceof SambaCommand || $command->getServer()->getId() !== $server->getId()) {
            throw new NotFoundHttpException('Команда не найдена');
        }
        if (!in_array($command->getStatus(), ['delivered', 'running'], true)) {
            return;
        }
        $status = (string) ($data['status'] ?? '');
        if (!in_array($status, ['succeeded', 'failed', 'rejected'], true)) {
            throw new BadRequestHttpException('Статус заполнен неверно');
        }
        $result = (string) ($data['result'] ?? '');
        $limit = 'directory.read' === $command->getType() ? 4_000_000 : 200_000;
        if (strlen($result) > $limit) {
            $result = substr($result, 0, $limit);
        }
        $command->finish($status, $result);
        $this->rememberDirectory($command);
        $this->entityManager->flush();
    }

    private function scheduleDirectory(SambaServer $server): void
    {
        $synced = $server->getDirectorySyncedAt();
        if ($synced instanceof \DateTimeInterface && $synced->getTimestamp() > time() - 3600) {
            return;
        }
        if ($this->commands->hasOpen($server, 'directory.read')) {
            return;
        }
        $this->entityManager->persist(new SambaCommand($server, null, 'агент', 'directory.read', [], null));
    }

    private function rememberDirectory(SambaCommand $command): void
    {
        if ('succeeded' !== $command->getStatus()) {
            return;
        }
        $server = $command->getServer();
        if ('directory.read' === $command->getType()) {
            $decoded = json_decode((string) $command->getResult(), true);
            if (!is_array($decoded) || !isset($decoded['ous'], $decoded['users'], $decoded['groups'])) {
                return;
            }
            $server->setDirectorySnapshot($decoded);
            $server->setDirectorySyncedAt(new \DateTime());

            return;
        }
        $snapshot = $server->getDirectorySnapshot();
        if (!is_array($snapshot)) {
            return;
        }
        $next = $this->patchDirectory($snapshot, $command);
        if (null !== $next) {
            $server->setDirectorySnapshot($next);
        }
    }

    /**
     * @param array<string, mixed> $snapshot
     *
     * @return array<string, mixed>|null
     */
    private function patchDirectory(array $snapshot, SambaCommand $command): ?array
    {
        $args = $command->getArgs();
        $name = trim((string) ($args['name'] ?? ''));
        $type = $command->getType();
        $bucket = match (true) {
            str_starts_with($type, 'user.') => 'users',
            str_starts_with($type, 'group.') => 'groups',
            str_starts_with($type, 'ou.') => 'ous',
            'object.move' === $type || 'object.write' === $type => match ((string) ($args['kind'] ?? '')) {
                'user' => 'users',
                'group' => 'groups',
                'ou' => 'ous',
                default => '',
            },
            default => '',
        };
        if ('' === $bucket || '' === $name || !isset($snapshot[$bucket]) || !is_array($snapshot[$bucket])) {
            return null;
        }
        $rows = $snapshot[$bucket];
        $drop = str_ends_with($type, '.delete');
        $kept = [];
        $found = false;
        foreach ($rows as $row) {
            if (!is_array($row) || 0 !== strcasecmp((string) ($row['name'] ?? ''), $name)) {
                $kept[] = $row;
                continue;
            }
            $found = true;
            if ($drop) {
                continue;
            }
            if ('object.move' === $type) {
                $parent = trim((string) ($args['parent'] ?? ''));
                $dn = (string) ($row['dn'] ?? '');
                $comma = strpos($dn, ',');
                if ('' !== $parent && false !== $comma) {
                    $row['dn'] = substr($dn, 0, $comma + 1).$parent;
                }
            }
            if ('object.write' === $type && is_array($args['attributes'] ?? null)) {
                $written = $args['attributes'];
                if (array_key_exists('displayName', $written)) {
                    $row['displayName'] = (string) $written['displayName'];
                }
                if (array_key_exists('description', $written)) {
                    $row['description'] = (string) $written['description'];
                }
            }
            $kept[] = $row;
        }
        if (!$found && in_array($type, ['user.ensure', 'group.ensure', 'ou.ensure'], true)) {
            $entry = ['name' => $name, 'cn' => $name, 'dn' => 'ous' === $bucket ? 'OU='.$name : ''];
            if ('users' === $bucket) {
                $entry['enabled'] = true;
            }
            if ('groups' === $bucket) {
                $entry['members'] = [];
            }
            $kept[] = $entry;
        }
        $snapshot[$bucket] = $kept;

        return $snapshot;
    }

    private function claim(SambaServer $server): ?SambaCommand
    {
        return $this->entityManager->wrapInTransaction(function () use ($server): ?SambaCommand {
            $command = $this->commands->findOldestQueued($server);
            if (!$command instanceof SambaCommand) {
                return null;
            }
            $command->markDelivered();

            return $command;
        });
    }

    public function requireServer(int $id): SambaServer
    {
        $server = $this->servers->find($id);

        return $server instanceof SambaServer ? $server : throw new NotFoundHttpException('Сервер не найден');
    }

    public static function lookup(string $secret): string
    {
        return substr(hash('sha256', $secret), 0, 16);
    }
}
