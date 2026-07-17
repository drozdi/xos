import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSchooltaskSubject, canReadSchooltaskSubject } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { SubjectIcon } from '../shared/AppIcons';

const SchooltaskSubjectsApp = lazy(() => import('./SchooltaskSubjectsApp'));

const manifest: AppManifest = {
	id: 'schooltask-subjects',
	name: 'Предметы',
	version: '1.0.0',
	icon: SubjectIcon,
	component: SchooltaskSubjectsApp,
	defaultSize: { width: 720, height: 480 },
	minSize: { width: 480, height: 320 },
	...createSchooltaskListManifestOptions('schooltask-subjects', 1),
	canAccess: () => canReadSchooltaskSubject() || canCreateSchooltaskSubject(),
};

export default manifest;
