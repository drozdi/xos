import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { NotesIcon } from '../shared/AppIcons';

const NoteApp = lazy(() => import('./NoteApp'));

const manifest: AppManifest = {
	id: 'note',
	name: 'Заметка',
	version: '1.0.0',
	icon: NotesIcon,
	component: NoteApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('note', 1),
	wmGroup: 'notes',
	taskbarGroup: 'notes',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
