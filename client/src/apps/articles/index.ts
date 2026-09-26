import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { ArticlesIcon } from '../shared/AppIcons';

const ArticlesApp = lazy(() => import('./ArticlesApp'));

const manifest: AppManifest = {
	id: 'articles',
	name: 'Статьи',
	version: '1.0.0',
	icon: ArticlesIcon,
	component: ArticlesApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'articles',
	wmSort: 40,
	startMenuSort: 40,
	startMenuGroup: 'content',
	taskbarGroup: 'articles',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
