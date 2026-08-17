<?php

namespace Pkb\Service;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Enum\VaultMemberRole;
use Pkb\Repository\VaultMemberRepository;

class PkbPermissionResolver
{
    public function __construct(
        private readonly VaultMemberRepository $vaultMemberRepository,
    ) {
    }

    public function isOwner(Vault $vault, User $user): bool
    {
        return $vault->getOwner()?->getId() === $user->getId();
    }

    public function resolveRole(Vault $vault, User $user): ?VaultMemberRole
    {
        if ($this->isOwner($vault, $user)) {
            return null;
        }

        $member = $this->vaultMemberRepository->findOneByVaultAndUser($vault, $user);

        return $member?->getRole();
    }

    public function canViewVault(Vault $vault, User $user): bool
    {
        return $this->isOwner($vault, $user) || null !== $this->resolveRole($vault, $user);
    }

    public function canReadFiles(Vault $vault, User $user): bool
    {
        if ($this->isOwner($vault, $user)) {
            return true;
        }

        $role = $this->resolveRole($vault, $user);

        return VaultMemberRole::Reader === $role || VaultMemberRole::Editor === $role;
    }

    public function canWriteFiles(Vault $vault, User $user): bool
    {
        if ($this->isOwner($vault, $user)) {
            return true;
        }

        return VaultMemberRole::Editor === $this->resolveRole($vault, $user);
    }

    public function canManageMembers(Vault $vault, User $user): bool
    {
        return $this->isOwner($vault, $user);
    }

    public function canUpdateVault(Vault $vault, User $user): bool
    {
        return $this->isOwner($vault, $user);
    }

    public function canDeleteVault(Vault $vault, User $user): bool
    {
        return $this->isOwner($vault, $user);
    }

    public function canRebuildIndex(Vault $vault, User $user): bool
    {
        return $this->isOwner($vault, $user);
    }
}
