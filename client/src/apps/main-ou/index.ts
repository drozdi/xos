import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateMainOu, canReadMainOu } from '@/features/main/mainAccess';
import { createMainDetailManifestOptions } from '@/features/main/mainAppUtils';

import { OuIcon } from '../shared/AppIcons';

const MainOuApp = lazy(() => import('./MainOuApp'));

const manifest: AppManifest = {
	id: 'main-ou',
	name: 'Подразделение',
	version: '1.0.0',
	icon: OuIcon,
	component: MainOuApp,
	defaultSize: { width: 480, height: 520 },
	minSize: { width: 360, height: 400 },
	...createMainDetailManifestOptions('main-ou', 2),
	canAccess: () => canReadMainOu() || canCreateMainOu(),
};

export default manifest;
