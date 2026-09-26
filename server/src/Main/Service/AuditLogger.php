<?php

namespace Main\Service;

use Main\Entity\AuditLog;
use Main\Entity\User;
use Main\Repository\AuditLogRepository;
use Symfony\Bundle\SecurityBundle\Security;

class AuditLogger
{
    public function __construct(
        private readonly AuditLogRepository $auditLogRepository,
        private readonly Security $security,
    ) {
    }

    /**
     * @param array<string, mixed>|null $payload
     */
    public function log(
        string $action,
        string $entityType,
        ?int $entityId,
        string $summary,
        ?array $payload = null,
        ?User $actor = null,
    ): void {
        $user = $actor;
        if (null === $user) {
            $current = $this->security->getUser();
            if ($current instanceof User) {
                $user = $current;
            }
        }

        $entry = new AuditLog();
        $entry->setAction($action);
        $entry->setEntityType($entityType);
        $entry->setEntityId($entityId);
        $entry->setSummary(mb_substr($summary, 0, 512));
        $entry->setPayload($payload);
        $entry->setActorId($user?->getId());
        $entry->setActorLabel($this->formatActorLabel($user));
        $entry->setCreatedAt(new \DateTimeImmutable());

        $this->auditLogRepository->save($entry, true);
    }

    private function formatActorLabel(?User $user): string
    {
        if (null === $user) {
            return 'system';
        }

        $label = $user->getAlias() ?: $user->getLogin() ?: ('#'.$user->getId());

        return mb_substr((string) $label, 0, 255);
    }
}
