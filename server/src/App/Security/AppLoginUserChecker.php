<?php

namespace App\Security;

use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Вход на standalone-страницу приложения (email):
 * активный пользователь с доступом к указанному модулю.
 */
final class AppLoginUserChecker implements UserCheckerInterface
{
    public function __construct(
        private readonly UserChecker $userChecker,
        private readonly UserScopeResolver $userScopeResolver,
        private readonly string $module,
        private readonly string $deniedMessage,
    ) {
    }

    public function checkPreAuth(UserInterface $user): void
    {
        $this->userChecker->checkPreAuth($user);
    }

    public function checkPostAuth(UserInterface $user): void
    {
        $this->userChecker->checkPostAuth($user);

        if (!$user instanceof User) {
            return;
        }

        if (!$this->userScopeResolver->canAccessModule($user, $this->module)) {
            throw new CustomUserMessageAccountStatusException($this->deniedMessage);
        }
    }
}
