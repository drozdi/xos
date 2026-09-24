import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canAccessRecipeApp } from '@/features/iblock-content/recipeAccess';

import { RecipesIcon } from '../shared/AppIcons';

const RecipesApp = lazy(() => import('./RecipesApp'));

const manifest: AppManifest = {
	id: 'recipes',
	name: 'Рецепты',
	version: '1.0.0',
	icon: RecipesIcon,
	component: RecipesApp,
	defaultSize: { width: 900, height: 580 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'recipes',
	wmSort: 20,
	startMenuSort: 20,
	startMenuGroup: 'content',
	taskbarGroup: 'recipes',
	requiredRole: 'recipe',
	canAccess: () => canAccessRecipeApp(),
};

export default manifest;
