import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadSchooltaskEvent, canUpdateSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskDetailManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { CalendarIcon } from '../shared/AppIcons';

const SchooltaskCalendarEditorApp = lazy(() => import('./SchooltaskCalendarEditorApp'));

const manifest: AppManifest = {
	id: 'schooltask-calendar-editor',
	name: 'Редактор расписания',
	version: '1.0.0',
	icon: CalendarIcon,
	component: SchooltaskCalendarEditorApp,
	defaultSize: { width: 960, height: 640 },
	minSize: { width: 720, height: 480 },
	...createSchooltaskDetailManifestOptions('schooltask-calendar-editor', 7),
	canAccess: () => canReadSchooltaskEvent() || canUpdateSchooltaskEvent(),
};

export default manifest;
