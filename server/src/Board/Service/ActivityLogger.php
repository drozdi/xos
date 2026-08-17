<?php

namespace Board\Service;

use Board\Entity\ActivityLog;
use Board\Entity\Board;
use Board\Entity\Card;
use Board\Enum\ActivityAction;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;

class ActivityLogger
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** @param array<string, mixed> $details */
    public function log(
        Board $board,
        ?Card $card,
        ?User $user,
        ActivityAction $action,
        array $details = [],
    ): ActivityLog {
        $entry = new ActivityLog();
        $entry->setBoard($board);
        $entry->setCard($card);
        $entry->setUser($user);
        $entry->setActionType($action->value);
        $entry->setDetails($details);

        $this->entityManager->persist($entry);

        return $entry;
    }
}
