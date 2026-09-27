import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { SettingsIcon } from '../shared/AppIcons';

const ShellSettingsApp = lazy(() => import('./ShellSettingsApp'));

/** Alias → settings?tab=shell (hidden from «Все приложения»). */
const manifest: AppManifest = {
	id: 'shell-settings',
	name: 'Макет оболочки',
	version: '1.1.0',
	icon: SettingsIcon,
	component: ShellSettingsApp,
	defaultSize: { width: 320, height: 200 },
	minSize: { width: 280, height: 160 },
	wmGroup: 'system',
	wmSort: 20,
	startMenuGroup: 'system',
	startMenuSort: 20,
	singleInstance: true,
	startMenuList: false,
};

export default manifest;
