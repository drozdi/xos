import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { TicTacToeIcon } from './TicTacToeIcon';
import { useTicTacToeStore } from './store';

const TicTacToeApp = lazy(() => import('./TicTacToeApp'));

const manifest: AppManifest = {
	id: 'tic-tac-toe',
	name: 'Крестики-нолики',
	version: '1.0.0',
	icon: TicTacToeIcon,
	component: TicTacToeApp,
	defaultSize: { width: 360, height: 420 },
	minSize: { width: 300, height: 360 },
	wmGroup: 'games',
	singleInstance: true,
	contextMenu: {
		windowOverrides: {
			refresh: {
				id: 'refresh',
				label: 'Новая игра',
				onClick: () => {
					useTicTacToeStore.getState().restart();
				},
			},
		},
	},
};

export default manifest;
