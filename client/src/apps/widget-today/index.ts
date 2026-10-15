import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetUpcomingIcon } from '../widget-upcoming/WidgetUpcomingIcon';

const WidgetTodayApp = lazy(() => import('./WidgetTodayApp'));

const manifest: AppManifest = {
	id: 'widget-today',
	name: 'Сегодня',
	version: '1.0.0',
	icon: WidgetUpcomingIcon,
	component: WidgetTodayApp,
	defaultSize: { width: 240, height: 200 },
	minSize: { width: 180, height: 120 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Задачи на сегодня и серия привычек',
};

export default manifest;
