import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { AudioPlayerIcon } from './AudioPlayerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-audio-player',
	label: 'Аудиоплеер',
	fileTypes: ['audio'],
	extensions: ['xos-playlist'],
	contextMenuLabel: 'Воспроизвести аудио',
});

const ExplorerAudioPlayerApp = lazy(() => import('./ExplorerAudioPlayerApp'));

const manifest: AppManifest = {
	id: 'explorer-audio-player',
	name: 'Аудиоплеер',
	version: '1.0.0',
	icon: AudioPlayerIcon,
	component: ExplorerAudioPlayerApp,
	defaultSize: { width: 720, height: 560 },
	minSize: { width: 480, height: 400 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	singleInstance: true,
	startMenu: true,
	menu: () => import('./menu').then((module) => module.default),
};

export default manifest;
