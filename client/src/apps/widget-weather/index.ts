import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetWeatherIcon } from './WidgetWeatherIcon';

const WidgetWeatherApp = lazy(() => import('./WidgetWeatherApp'));

const manifest: AppManifest = {
	id: 'widget-weather',
	name: 'Погода',
	version: '1.3.0',
	icon: WidgetWeatherIcon,
	component: WidgetWeatherApp,
	defaultSize: { width: 220, height: 96 },
	minSize: { width: 180, height: 80 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	shellRole: 'widget',
	showInTaskbar: false,
	startMenuList: false,
	widgetDescription: 'Текущая погода; клик — почасовой прогноз',
	window: {
		resizable: false,
	},
};

export default manifest;
