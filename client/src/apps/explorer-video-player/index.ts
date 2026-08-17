import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { VideoPlayerIcon } from './VideoPlayerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-video-player',
	label: 'Видеоплеер',
	fileTypes: ['video'],
	extensions: ['xos-playlist'],
	contextMenuLabel: 'Воспроизвести видео',
});

const ExplorerVideoPlayerApp = lazy(() => import('./ExplorerVideoPlayerApp'));

const manifest: AppManifest = {
	id: 'explorer-video-player',
	name: 'Видеоплеер',
	version: '1.0.0',
	icon: VideoPlayerIcon,
	component: ExplorerVideoPlayerApp,
	defaultSize: { width: 960, height: 720 },
	minSize: { width: 520, height: 480 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	singleInstance: true,
	startMenu: true,
	menu: () => import('./menu').then((module) => module.default),
};

export default manifest;
