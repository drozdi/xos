import { canAccessApp } from '@/core/auth/coreRoles';
import {
	canCreateIblockSection,
	canDeleteIblockSection,
	canReadIblockSection,
	canUpdateIblockSection,
	useCanCreateIblockSection,
	useCanDeleteIblockSection,
	useCanReadIblockSection,
	useCanUpdateIblockSection,
} from '@/features/iblock/iblockAccess';
import {
	canAccessRecipeApp,
	canManageRecipeCategories,
	useCanAccessRecipeApp,
	useCanManageRecipeCategories,
} from '@/features/iblock-content/recipeAccess';

/** Section/category: ROLE_IBLOCK scopes or ROLE_RECIPE (+ can_category for mutate). */
export const canReadCatalogSection = () =>
	(canAccessApp('iblock') && canReadIblockSection()) || canAccessRecipeApp();
export const canCreateCatalogSection = () =>
	(canAccessApp('iblock') && canCreateIblockSection()) || canManageRecipeCategories();
export const canUpdateCatalogSection = () =>
	(canAccessApp('iblock') && canUpdateIblockSection()) || canManageRecipeCategories();
export const canDeleteCatalogSection = () =>
	(canAccessApp('iblock') && canDeleteIblockSection()) || canManageRecipeCategories();

export const useCanReadCatalogSection = () =>
	useCanReadIblockSection() || useCanAccessRecipeApp();
export const useCanCreateCatalogSection = () =>
	useCanCreateIblockSection() || useCanManageRecipeCategories();
export const useCanUpdateCatalogSection = () =>
	useCanUpdateIblockSection() || useCanManageRecipeCategories();
export const useCanDeleteCatalogSection = () =>
	useCanDeleteIblockSection() || useCanManageRecipeCategories();
