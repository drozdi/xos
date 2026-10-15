import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetUpcomingIcon } from '../widget-upcoming/WidgetUpcomingIcon';

const WidgetExternalApp = lazy(() => import('./WidgetExternalApp'));

const manifest: AppManifest = {
	id: 'widget-external',
	name: 'Внешние задачи',
	version: '1.0.0',
	icon: WidgetUpcomingIcon,
	component: WidgetExternalApp,
	defaultSize: { width: 260, height: 220 },
	minSize: { width: 180, height: 120 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'GitHub Issues и задачи TeamStorm',
};

export default manifest;
