import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { contractAccess, createAssetsListManifestOptions } from '@/features/assets';

import { AssetsContractIcon } from '../shared/AppIcons';

const AssetsContractsApp = lazy(() => import('./AssetsContractsApp'));

const manifest: AppManifest = {
	id: 'assets-contracts',
	name: 'Договоры',
	version: '1.0.0',
	icon: AssetsContractIcon,
	component: AssetsContractsApp,
	defaultSize: { width: 920, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-contracts', 40),
	canAccess: () => contractAccess.canRead() || contractAccess.canCreate(),
};

export default manifest;
