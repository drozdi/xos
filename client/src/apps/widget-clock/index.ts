import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetClockIcon } from './WidgetClockIcon';

const WidgetClockApp = lazy(() => import('./WidgetClockApp'));

const manifest: AppManifest = {
	id: 'widget-clock',
	name: 'Часы',
	version: '1.0.0',
	icon: WidgetClockIcon,
	component: WidgetClockApp,
	defaultSize: { width: 280, height: 160 },
	minSize: { width: 220, height: 120 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	window: {
		resizable: false,
	},
};

export default manifest;
