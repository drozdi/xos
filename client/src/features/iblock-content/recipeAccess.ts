import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

const RECIPE_SCOPE = 'recipe';

function canRecipeBit(actionScope: string): boolean {
	if (!canAccessApp('recipe')) {
		return false;
	}
	if (isRoot() || isAppRoot('recipe') || isScopeRoot(RECIPE_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(RECIPE_SCOPE) & getCanScope(`${actionScope}.${RECIPE_SCOPE}`));
}

function useRecipeAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

/** ROLE_RECIPE — просмотр + создание/правка/удаление своих рецептов; категории и свойства — только чтение. */
export const canAccessRecipeApp = () => canAccessApp('recipe');
export const canReadRecipe = canAccessRecipeApp;
export const canWriteRecipe = canAccessRecipeApp;
export const canCreateRecipe = canAccessRecipeApp;
export const canUpdateRecipe = canAccessRecipeApp;
export const canDeleteRecipe = canAccessRecipeApp;

export const useCanAccessRecipeApp = () => useRecipeAccess(canAccessRecipeApp);
export const useCanReadRecipe = useCanAccessRecipeApp;
export const useCanWriteRecipe = useCanAccessRecipeApp;
export const useCanCreateRecipe = useCanAccessRecipeApp;
export const useCanUpdateRecipe = useCanAccessRecipeApp;
export const useCanDeleteRecipe = useCanAccessRecipeApp;

/** can_category.recipe — создавать / изменять / удалять категории (разделы). */
export const canManageRecipeCategories = () => canRecipeBit('can_category');
export const useCanManageRecipeCategories = () => useRecipeAccess(canManageRecipeCategories);

/** @deprecated */
export const canManageRecipeSections = canManageRecipeCategories;
export const useCanManageRecipeSections = useCanManageRecipeCategories;

/** @deprecated aliases for call sites during rename */
export const canReadRecipeElement = canReadRecipe;
export const canCreateRecipeElement = canCreateRecipe;
export const canUpdateRecipeElement = canUpdateRecipe;
export const canDeleteRecipeElement = canDeleteRecipe;
export const useCanReadRecipeElement = useCanReadRecipe;
export const useCanCreateRecipeElement = useCanCreateRecipe;
export const useCanUpdateRecipeElement = useCanUpdateRecipe;
export const useCanDeleteRecipeElement = useCanDeleteRecipe;
