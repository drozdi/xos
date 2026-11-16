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
        $token = bin2hex(random_bytes(24));
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
        if (strlen($result) > 200_000) {
            $result = substr($result, 0, 200_000);
        }
        $command->finish($status, $result);
        $this->entityManager->flush();
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
