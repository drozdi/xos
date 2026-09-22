import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockBlock, canReadIblockBlock } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockBlockApp = lazy(() => import('./IblockBlockApp'));

const manifest: AppManifest = {
	id: 'iblock-block',
	name: 'Инфоблок',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockBlockApp,
	defaultSize: { width: 520, height: 600 },
	minSize: { width: 400, height: 420 },
	...createIblockDetailManifestOptions('iblock-block', 1),
	canAccess: () => canReadIblockBlock() || canCreateIblockBlock(),
};

export default manifest;
