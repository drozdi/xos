import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { Game2048Icon } from './Game2048Icon';
import { useGame2048Store } from './store';

const Game2048App = lazy(() => import('./Game2048App'));

const manifest: AppManifest = {
	id: 'game-2048',
	name: '2048',
	version: '1.0.0',
	icon: Game2048Icon,
	component: Game2048App,
	defaultSize: { width: 400, height: 480 },
	minSize: { width: 320, height: 400 },
	wmGroup: 'games',
	startMenuGroup: 'games',
	taskbarGroup: 'games',
	singleInstance: true,
	menu: () => import('./menu').then((m) => m.default),
	contextMenu: {
		windowOverrides: {
			refresh: {
				id: 'refresh',
				label: 'Новая игра',
				onClick: () => useGame2048Store.getState().newGame(),
			},
		},
	},
};

export default manifest;
