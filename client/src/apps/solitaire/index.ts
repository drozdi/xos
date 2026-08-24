import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { openNewGameDialog } from './openNewGameDialog';
import { SolitaireIcon } from './SolitaireIcon';

const SolitaireApp = lazy(() => import('./SolitaireApp'));

const manifest: AppManifest = {
	id: 'solitaire',
	name: 'Косынка',
	version: '1.0.0',
	icon: SolitaireIcon,
	component: SolitaireApp,
	defaultSize: { width: 900, height: 640 },
	minSize: { width: 720, height: 520 },
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
