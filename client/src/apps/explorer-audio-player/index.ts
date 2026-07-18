import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { AudioPlayerIcon } from './AudioPlayerIcon';

registerExplorerFileAssociation({
	appId: 'explorer-audio-player',
	label: 'Аудиоплеер',
	fileTypes: ['audio'],
	contextMenuLabel: 'Воспроизвести аудио',
});

const ExplorerAudioPlayerApp = lazy(() => import('./ExplorerAudioPlayerApp'));

const manifest: AppManifest = {
	id: 'explorer-audio-player',
	name: 'Аудиоплеер',
	version: '1.0.0',
	icon: AudioPlayerIcon,
	component: ExplorerAudioPlayerApp,
	defaultSize: { width: 640, height: 420 },
	minSize: { width: 420, height: 280 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'user',
	startMenu: true,
};

export default manifest;
