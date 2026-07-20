import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';

import { ExplorerIcon } from './ExplorerIcon';

const ExplorerApp = lazy(() => import('./ExplorerApp'));

const manifest: AppManifest = {
	id: 'explorer',
	name: 'Проводник',
	version: '1.0.0',
	icon: ExplorerIcon,
	component: ExplorerApp,
	defaultSize: { width: 1100, height: 720 },
	minSize: { width: 760, height: 480 },
	wmGroup: 'system',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer',
	requiredRole: 'explorer',
	canAccess: canReadExplorer,
	singleInstance: true,
	startMenu: true,
};

export default manifest;
