<?php

namespace App\Security\UserProvider;

use Main\Entity\User;
use Main\Repository\UserRepository;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * Авторизация standalone-приложений (IncCom и др.): только по email.
 *
 * @implements UserProviderInterface<User>
 */
final class EmailUserProvider implements UserProviderInterface, PasswordUpgraderInterface
{
    public function __construct(
        private readonly UserRepository $users,
    ) {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $email = trim($identifier);
        if ('' === $email) {
            throw new UserNotFoundException('Email is empty.');
        }

        $user = $this->users->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            throw new UserNotFoundException(sprintf('User with email "%s" not found.', $email));
        }

        return $user;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Invalid user class "%s".', $user::class));
        }

        $email = $user->getEmail();
        if (null === $email || '' === $email) {
            throw new UserNotFoundException('User has no email.');
        }

        return $this->loadUserByIdentifier($email);
    }

    public function supportsClass(string $class): bool
    {
        return User::class === $class || is_subclass_of($class, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        $this->users->upgradePassword($user, $newHashedPassword);
    }
}
