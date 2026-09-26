import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	canCreateIblockSection,
	canDeleteIblockSection,
	canUpdateIblockSection,
} from '@/features/iblock/iblockAccess';

import { NotebooksIcon } from '../shared/AppIcons';

const NotebooksApp = lazy(() => import('./NotebooksApp'));

const manifest: AppManifest = {
	id: 'notebooks',
	name: 'Блокноты',
	version: '1.0.0',
	icon: NotebooksIcon,
	component: NotebooksApp,
	defaultSize: { width: 560, height: 520 },
	minSize: { width: 420, height: 360 },
	singleInstance: true,
	wmGroup: 'notebooks',
	wmSort: 15,
	startMenuSort: 15,
	startMenuGroup: 'content',
	taskbarGroup: 'notebooks',
	requiredRole: 'iblock',
	canAccess: () =>
		canCreateIblockSection() || canUpdateIblockSection() || canDeleteIblockSection(),
};

export default manifest;
