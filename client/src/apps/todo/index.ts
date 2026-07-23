import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseTodo } from '@/features/todo/todoAccess';

import { TodoIcon } from '../shared/AppIcons';

const TodoApp = lazy(() => import('./TodoApp'));

const manifest: AppManifest = {
	id: 'todo',
	name: 'Заметки',
	version: '1.0.0',
	icon: TodoIcon,
	component: TodoApp,
	defaultSize: { width: 720, height: 560 },
	minSize: { width: 420, height: 360 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUseTodo(),
};

export default manifest;
