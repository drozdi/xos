import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsDetailManifestOptions, roomAccess } from '@/features/assets';

import { AssetsRoomIcon } from '../shared/AppIcons';

const AssetsRoomApp = lazy(() => import('./AssetsRoomApp'));

const manifest: AppManifest = {
	id: 'assets-room',
	name: 'Помещение',
	version: '1.0.0',
	icon: AssetsRoomIcon,
	component: AssetsRoomApp,
	defaultSize: { width: 640, height: 520 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-rooms', 1),
	canAccess: () => roomAccess.canRead() || roomAccess.canCreate(),
};

export default manifest;
