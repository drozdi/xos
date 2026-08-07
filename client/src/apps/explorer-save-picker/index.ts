import { lazy } from 'react';

import { ExplorerIcon } from '@/apps/explorer/ExplorerIcon';
import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';

const ExplorerSavePickerApp = lazy(() => import('./ExplorerSavePickerApp'));

const manifest: AppManifest = {
	id: 'explorer-save-picker',
	name: 'Сохранить файл',
	version: '1.0.0',
	icon: ExplorerIcon,
	component: ExplorerSavePickerApp,
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
