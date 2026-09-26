import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsListManifestOptions, fleetAccess } from '@/features/assets';

import { AssetsFleetIcon } from '../shared/AppIcons';

const AssetsFleetApp = lazy(() => import('./AssetsFleetApp'));

const manifest: AppManifest = {
	id: 'assets-fleet',
	name: 'Автопарк',
	version: '1.0.0',
	icon: AssetsFleetIcon,
	component: AssetsFleetApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-fleet', 20),
	canAccess: () => fleetAccess.canRead() || fleetAccess.canCreate(),
};

export default manifest;
