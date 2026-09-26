import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { ServicesIcon } from '../shared/AppIcons';

const ServicesApp = lazy(() => import('./ServicesApp'));

const manifest: AppManifest = {
	id: 'services',
	name: 'Услуги',
	version: '1.0.0',
	icon: ServicesIcon,
	component: ServicesApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'services',
	wmSort: 50,
	startMenuSort: 50,
	startMenuGroup: 'content',
	taskbarGroup: 'services',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
