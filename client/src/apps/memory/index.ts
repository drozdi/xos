import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { MemoryIcon } from './MemoryIcon';
import { useMemoryStore } from './store';

const MemoryApp = lazy(() => import('./MemoryApp'));

const manifest: AppManifest = {
	id: 'memory',
	name: 'Memory',
	version: '1.0.0',
	icon: MemoryIcon,
	component: MemoryApp,
	defaultSize: { width: 420, height: 480 },
	minSize: { width: 340, height: 400 },
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
				onClick: () => useMemoryStore.getState().newGame(),
			},
		},
	},
};

export default manifest;
