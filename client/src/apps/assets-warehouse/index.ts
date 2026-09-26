import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	createAssetsListManifestOptions,
	warehouseAccess,
} from '@/features/assets';

import { AssetsWarehouseIcon } from '../shared/AppIcons';

const AssetsWarehouseApp = lazy(() => import('./AssetsWarehouseApp'));

const manifest: AppManifest = {
	id: 'assets-warehouse',
	name: 'Склад',
	version: '1.0.0',
	icon: AssetsWarehouseIcon,
	component: AssetsWarehouseApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-warehouse', 10),
	canAccess: () => warehouseAccess.canRead() || warehouseAccess.canCreate(),
};

export default manifest;
