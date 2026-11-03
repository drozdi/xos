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

export const useCanReadCatalogSection = () => {
	const iblock = useCanReadIblockSection();
	const recipe = useCanAccessRecipeApp();
	return iblock || recipe;
};
export const useCanCreateCatalogSection = () => {
	const iblock = useCanCreateIblockSection();
	const recipe = useCanManageRecipeCategories();
	return iblock || recipe;
};
export const useCanUpdateCatalogSection = () => {
	const iblock = useCanUpdateIblockSection();
	const recipe = useCanManageRecipeCategories();
	return iblock || recipe;
};
export const useCanDeleteCatalogSection = () => {
	const iblock = useCanDeleteIblockSection();
	const recipe = useCanManageRecipeCategories();
	return iblock || recipe;
};
