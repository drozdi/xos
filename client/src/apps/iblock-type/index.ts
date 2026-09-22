import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockType, canReadIblockType } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockTypeApp = lazy(() => import('./IblockTypeApp'));

const manifest: AppManifest = {
	id: 'iblock-type',
	name: 'Тип инфоблока',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockTypeApp,
	defaultSize: { width: 520, height: 560 },
	minSize: { width: 400, height: 420 },
	...createIblockDetailManifestOptions('iblock-type', 1),
	canAccess: () => canReadIblockType() || canCreateIblockType(),
};

export default manifest;
