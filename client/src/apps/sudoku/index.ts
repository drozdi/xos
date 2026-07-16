import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { openNewGameDialog } from './openNewGameDialog';
import { SudokuIcon } from './SudokuIcon';

const SudokuApp = lazy(() => import('./SudokuApp'));

const manifest: AppManifest = {
	id: 'sudoku',
	name: 'Судоку',
	version: '1.0.0',
	icon: SudokuIcon,
	component: SudokuApp,
	defaultSize: { width: 400, height: 560 },
	minSize: { width: 300, height: 400 },
	wmGroup: 'games',
	startMenuGroup: 'games',
	taskbarGroup: 'games',
	requiredRole: 'user',
	singleInstance: true,
	menu: () => import('./menu').then((module) => module.default),
	contextMenu: {
		windowOverrides: {
			refresh: {
				id: 'refresh',
				label: 'Новая игра',
				onClick: (ctx) => {
					if (!ctx.windowId) {return;}
					openNewGameDialog(getOrCreateCoreApi(ctx.windowId, ctx.appId));
				},
			},
		},
	},
};

export default manifest;
