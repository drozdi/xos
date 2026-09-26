import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsDetailManifestOptions, fleetAccess } from '@/features/assets';

import { AssetsFleetIcon } from '../shared/AppIcons';

const AssetsFleetVehicleApp = lazy(() => import('./AssetsFleetVehicleApp'));

const manifest: AppManifest = {
	id: 'assets-fleet-vehicle',
	name: 'Транспорт',
	version: '1.0.0',
	icon: AssetsFleetIcon,
	component: AssetsFleetVehicleApp,
	defaultSize: { width: 640, height: 560 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-fleet', 1),
	canAccess: () => fleetAccess.canRead() || fleetAccess.canCreate(),
};

export default manifest;
