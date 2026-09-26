import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { SettingsIcon } from '../shared/AppIcons';

const ShellSettingsApp = lazy(() => import('./ShellSettingsApp'));

const manifest: AppManifest = {
	id: 'shell-settings',
	name: 'Макет оболочки',
	version: '1.0.0',
	icon: SettingsIcon,
	component: ShellSettingsApp,
	defaultSize: { width: 440, height: 420 },
	minSize: { width: 360, height: 320 },
	wmGroup: 'system',
	wmSort: 20,
	startMenuGroup: 'system',
	startMenuSort: 20,
	singleInstance: true,
};

export default manifest;
