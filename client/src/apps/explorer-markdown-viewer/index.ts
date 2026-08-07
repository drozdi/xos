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
	version: '1.1.0',
	icon: MarkdownViewerIcon,
	component: ExplorerMarkdownViewerApp,
	defaultSize: { width: 960, height: 720 },
	minSize: { width: 520, height: 400 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	singleInstance: false,
	startMenu: true,
	menu: () => import('./menu').then((module) => module.default),
};

export default manifest;
