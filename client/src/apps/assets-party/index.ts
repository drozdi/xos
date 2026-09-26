import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsDetailManifestOptions, partyAccess } from '@/features/assets';

import { AssetsPartyIcon } from '../shared/AppIcons';

const AssetsPartyApp = lazy(() => import('./AssetsPartyApp'));

const manifest: AppManifest = {
	id: 'assets-party',
	name: 'Контрагент',
	version: '1.0.0',
	icon: AssetsPartyIcon,
	component: AssetsPartyApp,
	defaultSize: { width: 640, height: 520 },
	minSize: { width: 480, height: 400 },
	...createAssetsDetailManifestOptions('assets-parties', 1),
	canAccess: () => partyAccess.canRead() || partyAccess.canCreate(),
};

export default manifest;
