import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsListManifestOptions, softwareAccess } from '@/features/assets';

import { AssetsSoftwareIcon } from '../shared/AppIcons';

const AssetsSoftwareApp = lazy(() => import('./AssetsSoftwareApp'));

const manifest: AppManifest = {
	id: 'assets-software',
	name: 'ПО',
	version: '1.0.0',
	icon: AssetsSoftwareIcon,
	component: AssetsSoftwareApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-software', 60),
	canAccess: () => softwareAccess.canRead() || softwareAccess.canCreate(),
};

export default manifest;
