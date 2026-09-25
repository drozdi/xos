import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { SnakeIcon } from './SnakeIcon';
import { useSnakeStore } from './store';

const SnakeApp = lazy(() => import('./SnakeApp'));

const manifest: AppManifest = {
	id: 'snake',
	name: 'Змейка',
	version: '1.0.0',
	icon: SnakeIcon,
	component: SnakeApp,
	defaultSize: { width: 420, height: 520 },
	minSize: { width: 340, height: 420 },
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
				onClick: () => useSnakeStore.getState().newGame(),
			},
		},
	},
};

export default manifest;
