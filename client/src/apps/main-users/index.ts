import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { UsersIcon } from '../shared/AppIcons';

const MainUsersApp = lazy(() => import('./MainUsersApp'));

const manifest: AppManifest = {
	id: 'main-users',
	name: 'Пользователи',
	version: '1.0.0',
	icon: UsersIcon,
	component: MainUsersApp,
	defaultSize: { width: 800, height: 520 },
	minSize: { width: 560, height: 360 },
	...createMainListManifestOptions('main-user', 1),
};

export default manifest;
