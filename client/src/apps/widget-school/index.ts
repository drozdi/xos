import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetUpcomingIcon } from '../widget-upcoming/WidgetUpcomingIcon';

const WidgetSchoolApp = lazy(() => import('./WidgetSchoolApp'));

const manifest: AppManifest = {
	id: 'widget-school',
	name: 'Уроки',
	version: '1.0.0',
	icon: WidgetUpcomingIcon,
	component: WidgetSchoolApp,
	defaultSize: { width: 240, height: 200 },
	minSize: { width: 180, height: 120 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Уроки и файлы на сегодня',
};

export default manifest;
