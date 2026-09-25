import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';

import { StickyNoteIcon } from './StickyNoteIcon';

const StickyNoteApp = lazy(() => import('./StickyNoteApp'));

const manifest: AppManifest = {
	id: 'sticky-note',
	name: 'Стикер',
	version: '1.0.0',
	icon: StickyNoteIcon,
	component: StickyNoteApp,
	defaultSize: { width: 240, height: 220 },
	minSize: { width: 180, height: 160 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'sticky-note',
	singleInstance: false,
	window: {
		resizable: true,
	},
};

export default manifest;
