import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateMainClaimant, canReadMainClaimant } from '@/features/main/mainAccess';
import { createMainDetailManifestOptions } from '@/features/main/mainAppUtils';

import { ClaimantIcon } from '../shared/AppIcons';

const MainClaimantApp = lazy(() => import('./MainClaimantApp'));

const manifest: AppManifest = {
	id: 'main-claimant',
	name: 'Заявитель',
	version: '1.0.0',
	icon: ClaimantIcon,
	component: MainClaimantApp,
	defaultSize: { width: 400, height: 320 },
	minSize: { width: 320, height: 240 },
	...createMainDetailManifestOptions('main-claimant', 2),
	canAccess: () => canReadMainClaimant() || canCreateMainClaimant(),
};

export default manifest;
