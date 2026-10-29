import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	canCreateIblockSection,
	canDeleteIblockSection,
	canUpdateIblockSection,
} from '@/features/iblock/iblockAccess';

import { NotesIcon } from '../shared/AppIcons';

const NotebooksApp = lazy(() => import('./NotebooksApp'));

const manifest: AppManifest = {
	id: 'notebooks',
	name: 'Заметки: Блокноты',
	version: '1.0.0',
	icon: NotesIcon,
	component: NotebooksApp,
	defaultSize: { width: 560, height: 520 },
	minSize: { width: 420, height: 360 },
	singleInstance: true,
	wmGroup: 'notes',
	wmSort: 15,
	startMenu: false,
	taskbarGroup: 'notes',
	requiredRole: 'iblock',
	canAccess: () =>
		canCreateIblockSection() || canUpdateIblockSection() || canDeleteIblockSection(),
};

export default manifest;
