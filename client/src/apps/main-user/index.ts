import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainDetailManifestOptions } from '@/features/main/mainAppUtils';

import { UsersIcon } from '../shared/AppIcons';

const MainUserApp = lazy(() => import('./MainUserApp'));

const manifest: AppManifest = {
	id: 'main-user',
	name: 'Пользователь',
	version: '1.0.0',
	icon: UsersIcon,
	component: MainUserApp,
	defaultSize: { width: 480, height: 560 },
	minSize: { width: 360, height: 400 },
	...createMainDetailManifestOptions('main-user', 2),
};

export default manifest;
