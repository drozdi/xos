import { lazy } from 'react';

import { ExplorerIcon } from '@/apps/explorer/ExplorerIcon';
import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';

const ExplorerOpenPickerApp = lazy(() => import('./ExplorerOpenPickerApp'));

const manifest: AppManifest = {
	id: 'explorer-open-picker',
	name: 'Открыть файл',
	version: '1.0.0',
	icon: ExplorerIcon,
	component: ExplorerOpenPickerApp,
	defaultSize: { width: 1100, height: 720 },
	minSize: { width: 760, height: 480 },
	wmGroup: 'system',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer',
	requiredRole: 'explorer',
	canAccess: canReadExplorer,
	singleInstance: true,
	startMenu: false,
	startMenuList: false,
};

export default manifest;
