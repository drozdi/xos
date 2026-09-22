import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockBlock, canReadIblockBlock } from '@/features/iblock/iblockAccess';
import { createIblockListManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockBlocksApp = lazy(() => import('./IblockBlocksApp'));

const manifest: AppManifest = {
	id: 'iblock-blocks',
	name: 'Инфоблоки',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockBlocksApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createIblockListManifestOptions('iblock-blocks', 20),
	canAccess: () => canReadIblockBlock() || canCreateIblockBlock(),
};

export default manifest;
