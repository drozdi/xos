import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseCalendar } from '@/features/calendar/calendarAccess';

import { CalendarIcon } from '../shared/AppIcons';

const CalendarApp = lazy(() => import('./CalendarApp'));

const manifest: AppManifest = {
	id: 'calendar',
	name: 'Календарь',
	version: '1.0.0',
	icon: CalendarIcon,
	component: CalendarApp,
	defaultSize: { width: 1000, height: 700 },
	minSize: { width: 640, height: 480 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUseCalendar(),
};

export default manifest;
