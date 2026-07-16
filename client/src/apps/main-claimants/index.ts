import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { ClaimantIcon } from '../shared/AppIcons';

const MainClaimantsApp = lazy(() => import('./MainClaimantsApp'));

const manifest: AppManifest = {
	id: 'main-claimants',
	name: 'Заявители',
	version: '1.0.0',
	icon: ClaimantIcon,
	component: MainClaimantsApp,
	defaultSize: { width: 640, height: 480 },
	minSize: { width: 480, height: 320 },
	...createMainListManifestOptions('main-claimant', 1),
};

export default manifest;
