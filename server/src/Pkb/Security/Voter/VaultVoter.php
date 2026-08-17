<?php

namespace Pkb\Security\Voter;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Service\PkbPermissionResolver;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class VaultVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const READ = 'READ';
    public const WRITE = 'WRITE';
    public const MANAGE_MEMBERS = 'MANAGE_MEMBERS';
    public const DELETE = 'DELETE';
    public const UPDATE = 'UPDATE';

    public function __construct(
        private readonly PkbPermissionResolver $permissionResolver,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [
            self::VIEW,
            self::READ,
            self::WRITE,
            self::MANAGE_MEMBERS,
            self::DELETE,
            self::UPDATE,
        ], true) && $subject instanceof Vault;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Vault $vault */
        $vault = $subject;

        return match ($attribute) {
            self::VIEW => $this->permissionResolver->canViewVault($vault, $user),
            self::READ => $this->permissionResolver->canReadFiles($vault, $user),
            self::WRITE => $this->permissionResolver->canWriteFiles($vault, $user),
            self::MANAGE_MEMBERS => $this->permissionResolver->canManageMembers($vault, $user),
            self::DELETE => $this->permissionResolver->canDeleteVault($vault, $user),
            self::UPDATE => $this->permissionResolver->canUpdateVault($vault, $user),
            default => false,
        };
    }
}
