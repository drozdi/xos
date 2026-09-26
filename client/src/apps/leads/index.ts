import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { IdeasIcon } from '../shared/AppIcons';

const LeadsApp = lazy(() => import('./LeadsApp'));

const manifest: AppManifest = {
	id: 'leads',
	name: 'Лиды',
	version: '1.0.0',
	icon: IdeasIcon,
	component: LeadsApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'leads',
	wmSort: 54,
	startMenuSort: 54,
	startMenuGroup: 'content',
	taskbarGroup: 'leads',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
