import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskDetailManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { CalendarIcon } from '../shared/AppIcons';

const SchooltaskCalendarApp = lazy(() => import('./SchooltaskCalendarApp'));

const manifest: AppManifest = {
	id: 'schooltask-calendar',
	name: 'Календарь класса',
	version: '1.0.0',
	icon: CalendarIcon,
	component: SchooltaskCalendarApp,
	defaultSize: { width: 960, height: 640 },
	minSize: { width: 720, height: 480 },
	...createSchooltaskDetailManifestOptions('schooltask-calendar', 6),
	canAccess: () => canReadSchooltaskEvent(),
};

export default manifest;
