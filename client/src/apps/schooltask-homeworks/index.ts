import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canAccessSchooltaskCalendars } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { HomeworkIcon } from '../shared/AppIcons';

const SchooltaskHomeworksApp = lazy(() => import('./SchooltaskHomeworksApp'));

const manifest: AppManifest = {
	id: 'schooltask-homeworks',
	name: 'Домашние задания',
	version: '1.0.0',
	icon: HomeworkIcon,
	component: SchooltaskHomeworksApp,
	defaultSize: { width: 720, height: 520 },
	minSize: { width: 480, height: 360 },
	...createSchooltaskListManifestOptions('schooltask-homeworks', 6),
	canAccess: () => canAccessSchooltaskCalendars(),
};

export default manifest;
