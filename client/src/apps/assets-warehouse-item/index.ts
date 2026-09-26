import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	createAssetsDetailManifestOptions,
	warehouseAccess,
} from '@/features/assets';

import { AssetsWarehouseIcon } from '../shared/AppIcons';

const AssetsWarehouseItemApp = lazy(() => import('./AssetsWarehouseItemApp'));

const manifest: AppManifest = {
	id: 'assets-warehouse-item',
	name: 'Позиция склада',
	version: '1.0.0',
	icon: AssetsWarehouseIcon,
	component: AssetsWarehouseItemApp,
	defaultSize: { width: 640, height: 560 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-warehouse', 1),
	canAccess: () => warehouseAccess.canRead() || warehouseAccess.canCreate(),
};

export default manifest;
