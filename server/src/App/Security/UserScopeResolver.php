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
                $scopes[$code] = ($scopes[$code] ?? 0) | $access->getLevel();
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

    /**
     * Модуль доступен: ROLE_ROOT, ROLE_{module}, ROLE_{module}_ROOT (и legacy ROLE_{module}_ADMIN).
     */
    public function canAccessModule(User $user, string $module): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT'])) {
            return true;
        }

        $prefix = strtoupper(str_replace('.', '_', $module));

        return $this->userHasAnyRole($user, [
            "ROLE_{$prefix}",
            "ROLE_{$prefix}_ROOT",
            "ROLE_{$prefix}_ADMIN",
        ]);
    }

    /**
     * Полный доступ внутри модуля (скоупы не проверяются): ROLE_ROOT, ROLE_{module}_ROOT.
     */
    public function hasFullAppAccess(User $user, string $module): bool
    {
        if ($this->userHasAnyRole($user, ['ROLE_ROOT'])) {
            return true;
        }

        $prefix = strtoupper(str_replace('.', '_', $module));

        return $this->userHasAnyRole($user, ["ROLE_{$prefix}_ROOT"]);
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
            $module = $parts[0];
            if ($this->hasFullAppAccess($user, $module)) {
                return !$not;
            }

            $scopePath = implode('.', $parts);
            $scopeRootRole = 'ROLE_'.strtoupper(str_replace('.', '_', $scopePath)).'_ROOT';
            if ($this->userHasAnyRole($user, [$scopeRootRole])) {
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

        $canBit = $this->claimantManager->getCanScopeValue($scope);
        $result = ($level & $canBit) !== 0;

        return $not ? !$result : $result;
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

    public function canCreateSchooltaskSubject(User $user): bool
    {
        return $this->canSchooltaskSubject($user, 'can_create.schooltask.subject');
    }

    public function canReadSchooltaskSubject(User $user): bool
    {
        return $this->canSchooltaskSubject($user, 'can_read.schooltask.subject');
    }

    public function canUpdateSchooltaskSubject(User $user): bool
    {
        return $this->canSchooltaskSubject($user, 'can_update.schooltask.subject');
    }

    public function canDeleteSchooltaskSubject(User $user): bool
    {
        return $this->canSchooltaskSubject($user, 'can_delete.schooltask.subject');
    }

    public function canCreateSchooltaskClass(User $user): bool
    {
        return $this->canSchooltaskClass($user, 'can_create.schooltask.class');
    }

    public function canReadSchooltaskClass(User $user): bool
    {
        return $this->canSchooltaskClass($user, 'can_read.schooltask.class');
    }

    public function canUpdateSchooltaskClass(User $user): bool
    {
        return $this->canSchooltaskClass($user, 'can_update.schooltask.class');
    }

    public function canDeleteSchooltaskClass(User $user): bool
    {
        return $this->canSchooltaskClass($user, 'can_delete.schooltask.class');
    }

    public function canCreateSchooltaskEvent(User $user): bool
    {
        return $this->canSchooltaskEvent($user, 'can_create.schooltask.event');
    }

    public function canReadSchooltaskEvent(User $user): bool
    {
        return $this->canSchooltaskEvent($user, 'can_read.schooltask.event');
    }

    public function canUpdateSchooltaskEvent(User $user): bool
    {
        return $this->canSchooltaskEvent($user, 'can_update.schooltask.event');
    }

    public function canDeleteSchooltaskEvent(User $user): bool
    {
        return $this->canSchooltaskEvent($user, 'can_delete.schooltask.event');
    }

    private function canSchooltaskSubject(User $user, string $scope): bool
    {
        if (!$this->canAccessModule($user, 'schooltask')) {
            return false;
        }
        if ($this->hasFullAppAccess($user, 'schooltask')
            || $this->userHasAnyRole($user, ['ROLE_SCHOOLTASK_SUBJECT_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canSchooltaskClass(User $user, string $scope): bool
    {
        if (!$this->canAccessModule($user, 'schooltask')) {
            return false;
        }
        if ($this->hasFullAppAccess($user, 'schooltask')
            || $this->userHasAnyRole($user, ['ROLE_SCHOOLTASK_CLASS_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canSchooltaskEvent(User $user, string $scope): bool
    {
        if (!$this->canAccessModule($user, 'schooltask')) {
            return false;
        }
        if ($this->hasFullAppAccess($user, 'schooltask')
            || $this->userHasAnyRole($user, ['ROLE_SCHOOLTASK_EVENT_ROOT'])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
    }

    private function canMainOu(User $user, string $scope): bool
    {
        return $this->canMainScope($user, 'main', $scope, 'main.ou');
    }

    private function canMainClaimant(User $user, string $scope): bool
    {
        return $this->canMainScope($user, 'main', $scope, 'main.claimant');
    }

    private function canMainGroup(User $user, string $scope): bool
    {
        return $this->canMainScope($user, 'main', $scope, 'main.group');
    }

    private function canMainUser(User $user, string $scope): bool
    {
        return $this->canMainScope($user, 'main', $scope, 'main.user');
    }

    private function canMainScope(User $user, string $module, string $scope, string $scopePath): bool
    {
        if (!$this->canAccessModule($user, $module)) {
            return false;
        }

        $scopeRootRole = 'ROLE_'.strtoupper(str_replace('.', '_', $scopePath)).'_ROOT';
        if ($this->hasFullAppAccess($user, $module)
            || $this->userHasAnyRole($user, [$scopeRootRole])) {
            return true;
        }

        return $this->checkHasScope($user, $scope, false);
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
