import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetUpcomingIcon } from '../widget-upcoming/WidgetUpcomingIcon';

const WidgetExplorerApp = lazy(() => import('./WidgetExplorerApp'));

const manifest: AppManifest = {
	id: 'widget-explorer',
	name: 'Файлы',
	version: '1.0.0',
	icon: WidgetUpcomingIcon,
	component: WidgetExplorerApp,
	defaultSize: { width: 240, height: 200 },
	minSize: { width: 180, height: 120 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Последний путь и закреплённые папки',
};

export default manifest;
