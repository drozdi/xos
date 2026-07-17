import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSchooltaskClass, canReadSchooltaskClass } from '@/features/schooltask/schooltaskAccess';
import { createSchooltaskDetailManifestOptions } from '@/features/schooltask/schooltaskAppUtils';

import { ClassIcon } from '../shared/AppIcons';

const SchooltaskClassApp = lazy(() => import('./SchooltaskClassApp'));

const manifest: AppManifest = {
	id: 'schooltask-class',
	name: 'Класс',
	version: '1.0.0',
	icon: ClassIcon,
	component: SchooltaskClassApp,
	defaultSize: { width: 640, height: 520 },
	minSize: { width: 480, height: 420 },
	...createSchooltaskDetailManifestOptions('schooltask-class', 4),
	canAccess: () => canReadSchooltaskClass() || canCreateSchooltaskClass(),
};

export default manifest;
