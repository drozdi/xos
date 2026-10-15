import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetUpcomingIcon } from './WidgetUpcomingIcon';

const WidgetUpcomingApp = lazy(() => import('./WidgetUpcomingApp'));

const manifest: AppManifest = {
	id: 'widget-upcoming',
	name: 'Ближайшее',
	version: '1.0.0',
	icon: WidgetUpcomingIcon,
	component: WidgetUpcomingApp,
	defaultSize: { width: 240, height: 220 },
	minSize: { width: 180, height: 140 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Сроки задач, карточек и локальные напоминания',
	window: {
		resizable: false,
	},
};

export default manifest;
