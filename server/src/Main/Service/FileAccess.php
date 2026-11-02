<?php

namespace Main\Service;

use Main\Entity\File as MainFile;
use Main\Entity\User;

final class FileAccess
{
    public function canRead(MainFile $file, ?User $user): bool
    {
        if (!$user instanceof User) {
            return false;
        }
        $roles = $user->getRoles();
        if (\in_array('ROLE_ROOT', $roles, true) || \in_array('ROLE_ADMIN', $roles, true)) {
            return true;
        }
        $userId = $user->getId();

        return $file->getCreatedBy()?->getId() === $userId
            || $file->getModifiedBy()?->getId() === $userId;
    }
}
