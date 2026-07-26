<?php

namespace App\Security;

use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if (!$user->isAccountEnabled()) {
            throw new CustomUserMessageAccountStatusException('Учётная запись неактивна');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        if (!$this->hasBaseLoginRole($user)) {
            throw new CustomUserMessageAccountStatusException('Недостаточно прав для входа');
        }
    }

    private function hasBaseLoginRole(User $user): bool
    {
        $roles = $user->getRoles();

        return in_array(User::ROLE_USER, $roles, true)
            || in_array('ROLE_ROOT', $roles, true);
    }
}
