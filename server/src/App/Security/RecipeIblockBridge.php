<?php

namespace App\Security;

use Main\Entity\User;

/**
 * Bridges ROLE_RECIPE onto IBlock controllers for the recipes catalog.
 *
 * ROLE_RECIPE → read catalog + create/update/delete own recipe elements.
 * can_category.recipe → mutate categories (iblock sections of recipes block).
 */
final class RecipeIblockBridge
{
    public const RECIPES_BLOCK_CODE = 'recipes';

    public function __construct(
        private readonly UserScopeResolver $userScopeResolver,
    ) {
    }

    public function canAccessModule(User $user): bool
    {
        return $this->userScopeResolver->canAccessModule($user, 'recipe');
    }

    /**
     * Recipe-only: has recipe module, no iblock module.
     */
    public function isRecipeOnlyUser(User $user): bool
    {
        if ($this->userScopeResolver->canAccessModule($user, 'iblock')) {
            return false;
        }

        return $this->canAccessModule($user);
    }

    public function isRecipeElevated(User $user): bool
    {
        $roles = $user->getRoles();

        return \in_array('ROLE_ROOT', $roles, true)
            || \in_array('ROLE_RECIPE_ROOT', $roles, true)
            || \in_array('ROLE_RECIPE_ADMIN', $roles, true);
    }

    public function canManageCategories(User $user): bool
    {
        if ($this->isRecipeElevated($user)) {
            return true;
        }

        return $this->userScopeResolver->checkHasScope($user, 'can_category.recipe');
    }

    /**
     * Allow AccessSubscriber to pass when user lacks ROLE_IBLOCK but has ROLE_RECIPE (+ bits).
     */
    public function allowsIblockAccess(User $user, string $classScope, string $fullScope, bool $checkScopes): bool
    {
        if (!str_starts_with($classScope, 'iblock.')) {
            return false;
        }
        if (!$this->canAccessModule($user)) {
            return false;
        }

        $leaf = substr($classScope, \strlen('iblock.'));
        if (!preg_match('/^can_([a-z_]+)\.iblock\.(.+)$/', $fullScope, $m)) {
            return false;
        }

        $action = $m[1];
        $isRead = 'read' === $action;
        $isMutate = \in_array($action, ['create', 'update', 'delete'], true);

        if (\in_array($leaf, ['type', 'block'], true)) {
            return $isRead;
        }

        if ('element' === $leaf) {
            return $isRead || $isMutate;
        }

        if ('section' === $leaf) {
            if ($isRead) {
                return true;
            }
            if ($isMutate) {
                return !$checkScopes || $this->canManageCategories($user);
            }

            return false;
        }

        if ('property' === $leaf) {
            // Catalog bootstrap only — no recipe property admin app
            return $isRead;
        }

        return false;
    }
}
