import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsListManifestOptions, roomAccess } from '@/features/assets';

import { AssetsRoomIcon } from '../shared/AppIcons';

const AssetsRoomsApp = lazy(() => import('./AssetsRoomsApp'));

const manifest: AppManifest = {
	id: 'assets-rooms',
	name: 'Помещения',
	version: '1.0.0',
	icon: AssetsRoomIcon,
	component: AssetsRoomsApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-rooms', 50),
	canAccess: () => roomAccess.canRead() || roomAccess.canCreate(),
};

export default manifest;
