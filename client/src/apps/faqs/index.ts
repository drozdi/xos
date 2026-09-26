import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { FaqIcon } from '../shared/AppIcons';

const FaqsApp = lazy(() => import('./FaqsApp'));

const manifest: AppManifest = {
	id: 'faqs',
	name: 'FAQ',
	version: '1.0.0',
	icon: FaqIcon,
	component: FaqsApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'faqs',
	wmSort: 42,
	startMenuSort: 42,
	startMenuGroup: 'content',
	taskbarGroup: 'faqs',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
