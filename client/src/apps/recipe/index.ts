import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canAccessRecipeApp } from '@/features/iblock-content/recipeAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { RecipesIcon } from '../shared/AppIcons';

const RecipeApp = lazy(() => import('./RecipeApp'));

const base = createIblockDetailManifestOptions('recipe', 1);

const manifest: AppManifest = {
	id: 'recipe',
	name: 'Рецепт',
	version: '1.0.0',
	icon: RecipesIcon,
	component: RecipeApp,
	defaultSize: { width: 760, height: 780 },
	minSize: { width: 480, height: 420 },
	...base,
	requiredRole: 'recipe',
	startMenuGroup: 'content',
	canAccess: () => canAccessRecipeApp(),
};

export default manifest;
