import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetClockIcon } from './WidgetClockIcon';

const WidgetClockApp = lazy(() => import('./WidgetClockApp'));

const manifest: AppManifest = {
	id: 'widget-clock',
	name: 'Часы',
	version: '1.3.0',
	icon: WidgetClockIcon,
	component: WidgetClockApp,
	defaultSize: { width: 120, height: 72 },
	minSize: { width: 100, height: 56 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Текущее время и дата',
	window: {
		resizable: false,
	},
};

export default manifest;
