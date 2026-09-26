import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { IdeasIcon } from '../shared/AppIcons';

const IdeasApp = lazy(() => import('./IdeasApp'));

const manifest: AppManifest = {
	id: 'ideas',
	name: 'Идеи',
	version: '1.0.0',
	icon: IdeasIcon,
	component: IdeasApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'ideas',
	wmSort: 52,
	startMenuSort: 52,
	startMenuGroup: 'content',
	taskbarGroup: 'ideas',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
