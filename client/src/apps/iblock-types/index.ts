import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockType, canReadIblockType } from '@/features/iblock/iblockAccess';
import { createIblockListManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockTypesApp = lazy(() => import('./IblockTypesApp'));

const manifest: AppManifest = {
	id: 'iblock-types',
	name: 'Типы инфоблоков',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockTypesApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createIblockListManifestOptions('iblock-types', 10),
	canAccess: () => canReadIblockType() || canCreateIblockType(),
};

export default manifest;
