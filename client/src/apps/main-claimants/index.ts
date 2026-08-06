import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadMainClaimant } from '@/features/main/mainAccess';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { ClaimantIcon } from '../shared/AppIcons';

const MainClaimantsApp = lazy(() => import('./MainClaimantsApp'));

const manifest: AppManifest = {
	id: 'main-claimants',
	name: 'Доступные права',
	version: '1.0.0',
	icon: ClaimantIcon,
	component: MainClaimantsApp,
	defaultSize: { width: 640, height: 480 },
	minSize: { width: 480, height: 320 },
	...createMainListManifestOptions('main-claimant', 1),
	canAccess: canReadMainClaimant,
};

export default manifest;
