import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { SettingsIcon } from '../shared/AppIcons';

const SettingsApp = lazy(() => import('./SettingsApp'));

const manifest: AppManifest = {
	id: 'settings',
	name: 'Settings',
	version: '1.0.0',
	icon: SettingsIcon,
	component: SettingsApp,
	defaultSize: { width: 480, height: 560 },
	minSize: { width: 360, height: 400 },
	wmGroup: 'system',
	requiredRole: 'user',
	singleInstance: true,
};

export default manifest;
