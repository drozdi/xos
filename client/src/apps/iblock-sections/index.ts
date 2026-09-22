import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockSection, canReadIblockSection } from '@/features/iblock/iblockAccess';
import { createIblockListManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockSectionsApp = lazy(() => import('./IblockSectionsApp'));

const manifest: AppManifest = {
	id: 'iblock-sections',
	name: 'Разделы',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockSectionsApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createIblockListManifestOptions('iblock-sections', 30),
	canAccess: () => canReadIblockSection() || canCreateIblockSection(),
};

export default manifest;
