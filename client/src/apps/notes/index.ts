import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { NotesIcon } from '../shared/AppIcons';

const NotesApp = lazy(() => import('./NotesApp'));

const manifest: AppManifest = {
	id: 'notes',
	name: 'Заметки',
	version: '1.0.0',
	icon: NotesIcon,
	component: NotesApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'notes',
	wmSort: 10,
	startMenuSort: 10,
	startMenuGroup: 'content',
	taskbarGroup: 'notes',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
