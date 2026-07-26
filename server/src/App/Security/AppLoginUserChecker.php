<?php

namespace App\Security;

use Main\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Вход на standalone-страницу IncCom (/api/IncCom/auth/login):
 * активный пользователь с ROLE_USER или ROLE_ROOT и доступом к модулю inccom.
 */
final class AppLoginUserChecker implements UserCheckerInterface
{
    public function __construct(
        private readonly UserChecker $userChecker,
        private readonly UserScopeResolver $userScopeResolver,
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

        if (!$this->userScopeResolver->canAccessModule($user, 'inccom')) {
            throw new CustomUserMessageAccountStatusException(
                'Нет доступа к приложению «Доходы и расходы»',
            );
        }
    }
}
