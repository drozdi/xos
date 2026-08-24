import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { MinesweeperIcon } from './MinesweeperIcon';
import { openNewGameDialog } from './openNewGameDialog';

const MinesweeperApp = lazy(() => import('./MinesweeperApp'));

const manifest: AppManifest = {
	id: 'minesweeper',
	name: 'Сапёр',
	version: '1.0.0',
	icon: MinesweeperIcon,
	component: MinesweeperApp,
	defaultSize: { width: 400, height: 520 },
	minSize: { width: 360, height: 420 },
	wmGroup: 'games',
	startMenuGroup: 'games',
	taskbarGroup: 'games',
	singleInstance: true,
	menu: () => import('./menu').then((module) => module.default),
	contextMenu: {
		windowOverrides: {
			refresh: {
				id: 'refresh',
				label: 'Новая игра',
				onClick: (ctx) => {
					if (!ctx.windowId) {
						return;
					}
					openNewGameDialog(getOrCreateCoreApi(ctx.windowId, ctx.appId));
				},
			},
		},
	},
};

export default manifest;
