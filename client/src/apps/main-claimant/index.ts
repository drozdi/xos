import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadMainClaimant } from '@/features/main/mainAccess';
import { createMainDetailManifestOptions } from '@/features/main/mainAppUtils';

import { ClaimantIcon } from '../shared/AppIcons';

const MainClaimantApp = lazy(() => import('./MainClaimantApp'));

const manifest: AppManifest = {
	id: 'main-claimant',
	name: 'Доступное право',
	version: '1.0.0',
	icon: ClaimantIcon,
	component: MainClaimantApp,
	defaultSize: { width: 440, height: 420 },
	minSize: { width: 320, height: 280 },
	...createMainDetailManifestOptions('main-claimant', 2),
	canAccess: canReadMainClaimant,
};

export default manifest;
