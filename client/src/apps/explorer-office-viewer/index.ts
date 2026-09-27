import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { OfficeViewerIcon } from './OfficeViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-office-viewer',
	label: 'Документ',
	fileTypes: ['document'],
	extensions: ['docx', 'doc'],
	contextMenuLabel: 'Просмотр документа',
});

const ExplorerOfficeViewerApp = lazy(() => import('./ExplorerOfficeViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-office-viewer',
	name: 'Документы',
	version: '1.0.0',
	icon: OfficeViewerIcon,
	component: ExplorerOfficeViewerApp,
	defaultSize: { width: 880, height: 680 },
	minSize: { width: 480, height: 360 },
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
