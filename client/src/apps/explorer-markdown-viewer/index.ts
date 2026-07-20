import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { MarkdownViewerIcon } from './MarkdownViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-markdown-viewer',
	label: 'Markdown',
	fileTypes: ['markdown'],
	extensions: ['md', 'markdown', 'mdown'],
	contextMenuLabel: 'Просмотр Markdown',
});

const ExplorerMarkdownViewerApp = lazy(() => import('./ExplorerMarkdownViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-markdown-viewer',
	name: 'Markdown',
	version: '1.0.0',
	icon: MarkdownViewerIcon,
	component: ExplorerMarkdownViewerApp,
	defaultSize: { width: 860, height: 680 },
	minSize: { width: 480, height: 360 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	startMenu: true,
};

export default manifest;
