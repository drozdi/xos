import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	canReadSchooltaskEvent,
	canUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { CalendarIcon } from '../shared/AppIcons';

const SchooltaskCalendarsApp = lazy(() => import('./SchooltaskCalendarsApp'));

const manifest: AppManifest = {
	id: 'schooltask-calendars',
	name: 'Расписание',
	version: '1.0.0',
	icon: CalendarIcon,
	component: SchooltaskCalendarsApp,
	defaultSize: { width: 640, height: 480 },
	minSize: { width: 420, height: 320 },
	...createSchooltaskListManifestOptions('schooltask-calendars', 5),
	canAccess: () => canReadSchooltaskEvent() || canUpdateSchooltaskEvent(),
};

export default manifest;
