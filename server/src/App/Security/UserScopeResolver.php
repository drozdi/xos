<?php

namespace App\Security;

use Main\Entity\User;
use Main\Service\ClaimantManager;

final class UserScopeResolver
{
    public function __construct(
        private readonly ClaimantManager $claimantManager,
    ) {
    }

    /**
     * @return array<string, int>
     */
    public function resolve(User $user): array
    {
        $scopes = [];

        foreach ($user->getAccesses() as $access) {
            $code = $access->getCode();
            if (null !== $code) {
                $scopes[$code] = $access->getLevel();
            }
        }

        foreach ($user->getRoles() as $role) {
            foreach ($this->claimantManager->getAccessesRole($role) as $code => $level) {
                $scopes[$code] = ($scopes[$code] ?? 0) | $level;
            }
        }

        return $scopes;
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'login' => $user->getLogin(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'roles' => $user->getRoles(),
            'scopes' => $this->resolve($user),
        ];
    }

    public function canCreateMainOu(User $user): bool
    {
        return $this->canMainOu($user, 'can_create.main.ou');
    }

    public function canReadMainOu(User $user): bool
    {
        return $this->canMainOu($user, 'can_read.main.ou');
    }

    public function canUpdateMainOu(User $user): bool
    {
        return $this->canMainOu($user, 'can_update.main.ou');
    }

    public function canDeleteMainOu(User $user): bool
    {
        return $this->canMainOu($user, 'can_delete.main.ou');
    }

    public function canCreateMainClaimant(User $user): bool
    {
        return $this->canMainClaimant($user, 'can_create.main.claimant');
    }

    public function canReadMainClaimant(User $user): bool
    {
        return $this->canMainClaimant($user, 'can_read.main.claimant');
    }

    public function canUpdateMainClaimant(User $user): bool
    {
        return $this->canMainClaimant($user, 'can_update.main.claimant');
    }

    public function canDeleteMainClaimant(User $user): bool
    {
        return $this->canMainClaimant($user, 'can_delete.main.claimant');
    }

    public function canCreateMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_create.main.group');
    }

    public function canReadMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_read.main.group');
    }

    public function canUpdateMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_update.main.group');
    }

    public function canDeleteMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_delete.main.group');
    }

    public function canUserMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_user.main.group');
    }

    public function canAccessMainGroup(User $user): bool
    {
        return $this->canMainGroup($user, 'can_access.main.group');
    }

    public function canCreateMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_create.main.user');
    }

    public function canReadMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_read.main.user');
    }

    public function canUpdateMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_update.main.user');
    }

    public function canDeleteMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_delete.main.user');
    }

    public function canGroupMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_group.main.user');
    }

    public function canAccessMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_access.main.user');
    }

    public function canRoleMainUser(User $user): bool
    {
        return $this->canMainUser($user, 'can_role.main.user');
    }

    private function canMainOu(User $user, string $scope): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT', 'ROLE_MAIN_ROOT', 'ROLE_MAIN_OU_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canMainClaimant(User $user, string $scope): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT', 'ROLE_MAIN_ROOT', 'ROLE_MAIN_CLAIMANT_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canMainGroup(User $user, string $scope): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT', 'ROLE_MAIN_ROOT', 'ROLE_MAIN_GROUP_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canMainUser(User $user, string $scope): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT', 'ROLE_MAIN_ROOT', 'ROLE_MAIN_USER_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    public function checkHasScope(User $user, string $scope, bool $allowFullAppAccessBypass = true): bool
    {
        $not = false;
        if (str_starts_with($scope, '!')) {
            $not = true;
            $scope = substr($scope, 1);
        }

        $parts = explode('.', $scope);
        $can = array_shift($parts);
        if (!is_string($can) || !str_starts_with($can, 'can_')) {
            return false;
        }

        if ($allowFullAppAccessBypass && count($parts) > 0) {
            if ($this->hasFullAppAccess($user, $parts[0])) {
                return !$not;
            }
        }

        $scopes = $this->resolve($user);
        $level = 0;
        $current = '';
        foreach ($parts as $part) {
            $current = '' === $current ? $part : $current.'.'.$part;
            $level |= $scopes[$current] ?? 0;
        }

        $canBit = $this->getCanScopeValue($scope);
        $result = ($level & $canBit) !== 0;

        return $not ? !$result : $result;
    }

    private function hasFullAppAccess(User $user, string $appPrefix): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT'])) {
            return true;
        }

        $prefix = strtoupper(str_replace('.', '_', $appPrefix));

        return $this->userHasAnyRole($user, ["ROLE_{$prefix}_ROOT", "ROLE_{$prefix}_ADMIN"]);
    }

    private function getCanScopeValue(string $scope): int
    {
        $segments = explode('.', $scope);
        $canKey = array_shift($segments);
        if (!is_string($canKey) || !str_starts_with($canKey, 'can_') || [] === $segments) {
            return 0;
        }

        $app = strtolower($segments[0]);
        $map = $this->claimantManager->getMap()[$app]['map-access'] ?? [];
        $current = $map;

        for ($i = 1, $count = count($segments); $i < $count; ++$i) {
            if (!is_array($current) || !array_key_exists($segments[$i], $current)) {
                return 0;
            }
            $current = $current[$segments[$i]];
        }

        if (!is_array($current) || !array_key_exists($canKey, $current)) {
            return 0;
        }

        return (int) $current[$canKey];
    }

    /**
     * @param list<string> $roles
     */
    private function userHasAnyRole(User $user, array $roles): bool
    {
        $userRoles = $user->getRoles();
        foreach ($roles as $role) {
            if (in_array($role, $userRoles, true)) {
                return true;
            }
        }

        return false;
    }
}
