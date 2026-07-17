import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSchooltaskSubject, canReadSchooltaskSubject } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskDetailManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { SubjectIcon } from '../shared/AppIcons';

const SchooltaskSubjectApp = lazy(() => import('./SchooltaskSubjectApp'));

const manifest: AppManifest = {
	id: 'schooltask-subject',
	name: 'Предмет',
	version: '1.0.0',
	icon: SubjectIcon,
	component: SchooltaskSubjectApp,
	defaultSize: { width: 520, height: 420 },
	minSize: { width: 400, height: 320 },
	...createSchooltaskDetailManifestOptions('schooltask-subject', 2),
	canAccess: () => canReadSchooltaskSubject() || canCreateSchooltaskSubject(),
};

export default manifest;
