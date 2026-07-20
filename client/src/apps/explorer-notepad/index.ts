import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { registerExplorerFileAssociation } from '@/features/explorer/openWithRegistry';

import { NotepadIcon } from './NotepadIcon';

registerExplorerFileAssociation({
	appId: 'explorer-notepad',
	label: 'Блокнот',
	fileTypes: ['text'],
	contextMenuLabel: 'Открыть в блокноте',
});

const ExplorerNotepadApp = lazy(() => import('./ExplorerNotepadApp'));

const manifest: AppManifest = {
	id: 'explorer-notepad',
	name: 'Блокнот',
	version: '1.0.0',
	icon: NotepadIcon,
	component: ExplorerNotepadApp,
	defaultSize: { width: 720, height: 560 },
	minSize: { width: 480, height: 360 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'explorer-tools',
	requiredRole: 'explorer',
	startMenu: true,
};

export default manifest;
