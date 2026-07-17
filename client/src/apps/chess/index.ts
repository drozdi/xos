import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { ChessIcon } from './ChessIcon';
import { useChessStore } from './chessStore';

const ChessApp = lazy(() => import('./ChessApp'));

const manifest: AppManifest = {
	id: 'chess',
	name: 'Шахматы',
	version: '1.0.0',
	icon: ChessIcon,
	component: ChessApp,
	defaultSize: { width: 920, height: 720 },
	minSize: { width: 720, height: 560 },
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
				onClick: () => {
					useChessStore.getState().requestRestart();
				},
			},
		},
	},
};

export default manifest;
