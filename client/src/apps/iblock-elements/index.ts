import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockListManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockElementsApp = lazy(() => import('./IblockElementsApp'));

const manifest: AppManifest = {
	id: 'iblock-elements',
	name: 'Элементы',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockElementsApp,
	defaultSize: { width: 800, height: 520 },
	minSize: { width: 560, height: 360 },
	...createIblockListManifestOptions('iblock-elements', 40),
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
