import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSchooltaskClass, canReadSchooltaskClass } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskListManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { ClassIcon } from '../shared/AppIcons';

const SchooltaskClassesApp = lazy(() => import('./SchooltaskClassesApp'));

const manifest: AppManifest = {
	id: 'schooltask-classes',
	name: 'Классы',
	version: '1.0.0',
	icon: ClassIcon,
	component: SchooltaskClassesApp,
	defaultSize: { width: 760, height: 480 },
	minSize: { width: 480, height: 320 },
	...createSchooltaskListManifestOptions('schooltask-classes', 3),
	canAccess: () => canReadSchooltaskClass() || canCreateSchooltaskClass(),
};

export default manifest;
