import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetRemindersIcon } from './WidgetRemindersIcon';

const WidgetRemindersApp = lazy(() => import('./WidgetRemindersApp'));

const manifest: AppManifest = {
	id: 'widget-reminders',
	name: 'Напоминания',
	version: '1.1.0',
	icon: WidgetRemindersIcon,
	component: WidgetRemindersApp,
	defaultSize: { width: 220, height: 240 },
	minSize: { width: 180, height: 180 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Лента уведомлений и локальные напоминания',
	window: {
		resizable: false,
	},
};

export default manifest;
