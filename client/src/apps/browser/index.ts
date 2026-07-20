import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { BrowserIcon } from './BrowserIcon';

const BrowserApp = lazy(() => import('./BrowserApp'));

const manifest: AppManifest = {
	id: 'browser',
	name: 'Браузер',
	version: '1.0.0',
	icon: BrowserIcon,
	component: BrowserApp,
	defaultSize: { width: 960, height: 640 },
	minSize: { width: 480, height: 360 },
	wmGroup: 'browser',
	startMenuGroup: 'tools',
	taskbarGroup: 'browser',
	singleInstance: false,
	instanceKey: (params) => params?.instanceKey ?? String(Date.now()),
};

export default manifest;
