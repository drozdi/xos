import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';

import { DiffViewerIcon } from './DiffViewerIcon';

const ExplorerDiffApp = lazy(() => import('./ExplorerDiffApp'));

const manifest: AppManifest = {
	id: 'explorer-diff',
	name: 'Сравнение',
	version: '1.0.0',
	icon: DiffViewerIcon,
	component: ExplorerDiffApp,
	defaultSize: { width: 960, height: 680 },
	minSize: { width: 560, height: 400 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	canAccess: canReadExplorer,
	singleInstance: false,
	startMenu: true,
	menu: () => import('./menu').then((m) => m.default),
};

export default manifest;
