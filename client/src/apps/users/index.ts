import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { UsersIcon } from '../shared/AppIcons';

const UsersApp = lazy(() => import('./UsersApp'));

const manifest: AppManifest = {
	id: 'users',
	name: 'Users',
	version: '1.0.0',
	icon: UsersIcon,
	component: UsersApp,
	defaultSize: { width: 720, height: 480 },
	minSize: { width: 480, height: 320 },
	wmGroup: 'admin',
	requiredRole: 'admin',
	singleInstance: true,
};

export default manifest;
