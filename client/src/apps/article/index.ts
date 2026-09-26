import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { ArticlesIcon } from '../shared/AppIcons';

const ArticleApp = lazy(() => import('./ArticleApp'));

const manifest: AppManifest = {
	id: 'article',
	name: 'Статья',
	version: '1.0.0',
	icon: ArticlesIcon,
	component: ArticleApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('article', 41),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
