import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { CodeViewerIcon } from './CodeViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-code-viewer',
	label: 'Код',
	fileTypes: ['code'],
	contextMenuLabel: 'Просмотр кода',
});

const ExplorerCodeViewerApp = lazy(() => import('./ExplorerCodeViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-code-viewer',
	name: 'Код',
	version: '1.0.0',
	icon: CodeViewerIcon,
	component: ExplorerCodeViewerApp,
	defaultSize: { width: 900, height: 640 },
	minSize: { width: 480, height: 360 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	singleInstance: false,
	startMenu: true,
	menu: () => import('./menu').then((m) => m.default),
};

export default manifest;
