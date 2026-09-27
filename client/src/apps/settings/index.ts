import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { SettingsIcon } from '../shared/AppIcons';

const SettingsApp = lazy(() => import('./SettingsApp'));

const manifest: AppManifest = {
	id: 'settings',
	name: 'Настройки',
	version: '1.1.0',
	icon: SettingsIcon,
	component: SettingsApp,
	defaultSize: { width: 520, height: 640 },
	minSize: { width: 400, height: 420 },
	wmGroup: 'system',
	wmSort: 10,
	startMenuGroup: 'system',
	startMenuSort: 10,
	singleInstance: true,
	startMenuList: false,
};

export default manifest;
