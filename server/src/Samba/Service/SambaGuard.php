<?php

namespace Samba\Service;

use Main\Entity\User;
use Samba\Entity\SambaServer;
use Samba\Repository\SambaServerRepository;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class SambaGuard
{
    public function __construct(private readonly SambaServerRepository $servers)
    {
    }

    public function assertDeletable(User $user): void
    {
        if ($this->servers->countOwned($user) > 0) {
            throw new ConflictHttpException('Сначала передайте серверы');
        }
    }

    public static function isOwner(User $actor, SambaServer $server): bool
    {
        $owner = $server->getOwner();
        if ($actor === $owner) {
            return true;
        }

        return null !== $actor->getId() && $actor->getId() === $owner->getId();
    }
}
