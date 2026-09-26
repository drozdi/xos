import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IdeasIcon } from '../shared/AppIcons';

const IdeaApp = lazy(() => import('./IdeaApp'));

const manifest: AppManifest = {
	id: 'idea',
	name: 'Идея',
	version: '1.0.0',
	icon: IdeasIcon,
	component: IdeaApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('idea', 53),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
