import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { CalendarIcon } from '../shared/AppIcons';

const SchooltaskCalendarsApp = lazy(() => import('./SchooltaskCalendarsApp'));

const manifest: AppManifest = {
	id: 'schooltask-calendars',
	name: 'Расписание',
	version: '1.0.0',
	icon: CalendarIcon,
	component: SchooltaskCalendarsApp,
	defaultSize: { width: 480, height: 420 },
	minSize: { width: 360, height: 300 },
	...createSchooltaskListManifestOptions('schooltask-calendars', 5),
	canAccess: () => canReadSchooltaskEvent(),
};

export default manifest;
