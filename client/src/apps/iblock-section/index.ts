import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockSection, canReadIblockSection } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockSectionApp = lazy(() => import('./IblockSectionApp'));

const manifest: AppManifest = {
	id: 'iblock-section',
	name: 'Раздел',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockSectionApp,
	defaultSize: { width: 560, height: 640 },
	minSize: { width: 420, height: 420 },
	...createIblockDetailManifestOptions('iblock-section', 1),
	canAccess: () => canReadIblockSection() || canCreateIblockSection(),
};

export default manifest;
