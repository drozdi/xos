import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadSchooltaskEvent, canUpdateSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { CalendarIcon } from '../shared/AppIcons';

const SchooltaskCalendarTeacherApp = lazy(() => import('./SchooltaskCalendarTeacherApp'));

const manifest: AppManifest = {
	id: 'schooltask-calendar-teacher',
	name: 'Мои уроки',
	version: '1.0.0',
	icon: CalendarIcon,
	component: SchooltaskCalendarTeacherApp,
	defaultSize: { width: 960, height: 640 },
	minSize: { width: 720, height: 480 },
	...createSchooltaskListManifestOptions('schooltask-calendar-teacher', 8),
	canAccess: () => canReadSchooltaskEvent() || canUpdateSchooltaskEvent(),
};

export default manifest;
