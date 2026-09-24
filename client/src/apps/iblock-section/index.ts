import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockSection, canReadIblockSection } from '@/features/iblock/iblockAccess';
import { canManageRecipeCategories } from '@/features/iblock-content/recipeAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockSectionApp = lazy(() => import('./IblockSectionApp'));

const base = createIblockDetailManifestOptions('iblock-section', 1);

const manifest: AppManifest = {
	id: 'iblock-section',
	name: 'Раздел',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockSectionApp,
	defaultSize: { width: 560, height: 640 },
	minSize: { width: 420, height: 420 },
	...base,
	requiredRole: undefined,
	canAccess: () =>
		canReadIblockSection() || canCreateIblockSection() || canManageRecipeCategories(),
};

export default manifest;
