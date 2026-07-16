import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { OuIcon } from '../shared/AppIcons';

const MainOusApp = lazy(() => import('./MainOusApp'));

const manifest: AppManifest = {
	id: 'main-ous',
	name: 'Подразделения',
	version: '1.0.0',
	icon: OuIcon,
	component: MainOusApp,
	defaultSize: { width: 800, height: 520 },
	minSize: { width: 560, height: 360 },
	...createMainListManifestOptions('main-ou', 1),
};

export default manifest;
