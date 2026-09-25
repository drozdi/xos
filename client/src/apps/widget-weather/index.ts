import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { WidgetWeatherIcon } from './WidgetWeatherIcon';

const WidgetWeatherApp = lazy(() => import('./WidgetWeatherApp'));

const manifest: AppManifest = {
	id: 'widget-weather',
	name: 'Погода',
	version: '1.0.0',
	icon: WidgetWeatherIcon,
	component: WidgetWeatherApp,
	defaultSize: { width: 320, height: 280 },
	minSize: { width: 260, height: 220 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	window: {
		resizable: false,
	},
};

export default manifest;
