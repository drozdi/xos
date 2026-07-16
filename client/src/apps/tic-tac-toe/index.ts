import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { openNewGameDialog } from './openNewGameDialog';
import { TicTacToeIcon } from './TicTacToeIcon';
const TicTacToeApp = lazy(() => import('./TicTacToeApp'));

const manifest: AppManifest = {
	id: 'tic-tac-toe',
	name: 'Крестики-нолики',
	version: '1.0.0',
	icon: TicTacToeIcon,
	component: TicTacToeApp,
	defaultSize: { width: 360, height: 480 },
	minSize: { width: 300, height: 360 },
	wmGroup: 'games',
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
