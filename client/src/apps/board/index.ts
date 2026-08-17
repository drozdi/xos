import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseBoard } from '@/features/board/boardAccess';

import { BoardIcon } from '../shared/AppIcons';

const BoardApp = lazy(() => import('./BoardApp'));

const manifest: AppManifest = {
	id: 'board',
	name: 'Доска',
	version: '1.0.0',
	icon: BoardIcon,
	component: BoardApp,
	defaultSize: { width: 1000, height: 700 },
	minSize: { width: 640, height: 480 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUseBoard(),
};

export default manifest;
