import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadExplorer } from '@/features/explorer/explorerAccess';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { PdfViewerIcon } from './PdfViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-pdf-viewer',
	label: 'PDF',
	fileTypes: ['document'],
	extensions: ['pdf'],
	contextMenuLabel: 'Открыть PDF',
});

const ExplorerPdfViewerApp = lazy(() => import('./ExplorerPdfViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-pdf-viewer',
	name: 'PDF',
	version: '1.0.0',
	icon: PdfViewerIcon,
	component: ExplorerPdfViewerApp,
	defaultSize: { width: 900, height: 720 },
	minSize: { width: 480, height: 400 },
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
