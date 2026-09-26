import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsDetailManifestOptions, softwareAccess } from '@/features/assets';

import { AssetsSoftwareIcon } from '../shared/AppIcons';

const AssetsSoftwareItemApp = lazy(() => import('./AssetsSoftwareItemApp'));

const manifest: AppManifest = {
	id: 'assets-software-item',
	name: 'Программный пакет',
	version: '1.0.0',
	icon: AssetsSoftwareIcon,
	component: AssetsSoftwareItemApp,
	defaultSize: { width: 640, height: 560 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-software', 1),
	canAccess: () => softwareAccess.canRead() || softwareAccess.canCreate(),
};

export default manifest;
