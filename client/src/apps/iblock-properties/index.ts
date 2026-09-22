import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockProperty, canReadIblockProperty } from '@/features/iblock/iblockAccess';
import { createIblockListManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockPropertiesApp = lazy(() => import('./IblockPropertiesApp'));

const manifest: AppManifest = {
	id: 'iblock-properties',
	name: 'Свойства инфоблоков',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockPropertiesApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createIblockListManifestOptions('iblock-properties', 50),
	canAccess: () => canReadIblockProperty() || canCreateIblockProperty(),
};

export default manifest;
