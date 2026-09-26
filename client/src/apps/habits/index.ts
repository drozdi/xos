import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseTodo } from '@/features/todo/todoAccess';

import { HabitsIcon } from '../shared/AppIcons';

const HabitsApp = lazy(() => import('./HabitsApp'));

const manifest: AppManifest = {
	id: 'habits',
	name: 'Привычки',
	version: '1.0.0',
	icon: HabitsIcon,
	component: HabitsApp,
	defaultSize: { width: 820, height: 520 },
	minSize: { width: 560, height: 360 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUseTodo(),
};

export default manifest;
