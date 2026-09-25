import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { MapViewerIcon } from './MapViewerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-map-viewer',
	label: 'Карта',
	fileTypes: ['geo'],
	extensions: ['gpx', 'kml'],
	contextMenuLabel: 'Открыть на карте',
});

const ExplorerMapViewerApp = lazy(() => import('./ExplorerMapViewerApp'));

const manifest: AppManifest = {
	id: 'explorer-map-viewer',
	name: 'Карта',
	version: '1.0.0',
	icon: MapViewerIcon,
	component: ExplorerMapViewerApp,
	defaultSize: { width: 900, height: 680 },
	minSize: { width: 480, height: 400 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	singleInstance: false,
	startMenu: true,
	menu: () => import('./menu').then((m) => m.default),
};

export default manifest;
