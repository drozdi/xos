import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canManageRecipeCategories } from '@/features/iblock-content/recipeAccess';

import { RecipesIcon } from '../shared/AppIcons';

const RecipeCategoriesApp = lazy(() => import('./RecipeCategoriesApp'));

const manifest: AppManifest = {
	id: 'recipe-categories',
	name: 'Рецепты: Категории',
	version: '1.0.0',
	icon: RecipesIcon,
	component: RecipeCategoriesApp,
	defaultSize: { width: 560, height: 520 },
	minSize: { width: 420, height: 360 },
	singleInstance: true,
	wmGroup: 'recipes',
	wmSort: 30,
	startMenu: false,
	taskbarGroup: 'recipes',
	requiredRole: 'recipe',
	canAccess: () => canManageRecipeCategories(),
};

export default manifest;
