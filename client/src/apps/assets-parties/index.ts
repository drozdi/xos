import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createAssetsListManifestOptions, partyAccess } from '@/features/assets';

import { AssetsPartyIcon } from '../shared/AppIcons';

const AssetsPartiesApp = lazy(() => import('./AssetsPartiesApp'));

const manifest: AppManifest = {
	id: 'assets-parties',
	name: 'Контрагенты',
	version: '1.0.0',
	icon: AssetsPartyIcon,
	component: AssetsPartiesApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	...createAssetsListManifestOptions('assets-parties', 30),
	canAccess: () => partyAccess.canRead() || partyAccess.canCreate(),
};

export default manifest;
