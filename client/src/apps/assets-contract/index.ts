import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { contractAccess, createAssetsDetailManifestOptions } from '@/features/assets';

import { AssetsContractIcon } from '../shared/AppIcons';

const AssetsContractApp = lazy(() => import('./AssetsContractApp'));

const manifest: AppManifest = {
	id: 'assets-contract',
	name: 'Договор',
	version: '1.0.0',
	icon: AssetsContractIcon,
	component: AssetsContractApp,
	defaultSize: { width: 640, height: 600 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-contracts', 1),
	canAccess: () => contractAccess.canRead() || contractAccess.canCreate(),
};

export default manifest;
