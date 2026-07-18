import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { ImageViewerIcon } from './ImageViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-image-viewer',
	label: 'Просмотр изображений',
	fileTypes: ['image'],
	contextMenuLabel: 'Просмотр изображения',
});

const ExplorerImageViewerApp = lazy(() => import('./ExplorerImageViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-image-viewer',
	name: 'Изображения',
	version: '1.0.0',
	icon: ImageViewerIcon,
	component: ExplorerImageViewerApp,
	defaultSize: { width: 900, height: 640 },
	minSize: { width: 420, height: 320 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'user',
	startMenu: true,
};

export default manifest;
