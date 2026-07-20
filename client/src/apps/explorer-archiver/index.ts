import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { ArchiverIcon } from './ArchiverIcon';

registerExplorerFileAssociation({
	appId: 'explorer-archiver',
	label: 'Архиватор',
	fileTypes: ['archive'],
	contextMenuLabel: 'Открыть архиватор',
});

const ExplorerArchiverApp = lazy(() => import('./ExplorerArchiverApp'));

const manifest: AppManifest = {
	id: 'explorer-archiver',
	name: 'Архиватор',
	version: '1.0.0',
	icon: ArchiverIcon,
	component: ExplorerArchiverApp,
	defaultSize: { width: 560, height: 420 },
	minSize: { width: 420, height: 280 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	startMenu: true,
};

export default manifest;
