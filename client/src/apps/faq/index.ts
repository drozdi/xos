import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { FaqIcon } from '../shared/AppIcons';

const FaqApp = lazy(() => import('./FaqApp'));

const manifest: AppManifest = {
	id: 'faq',
	name: 'Вопрос',
	version: '1.0.0',
	icon: FaqIcon,
	component: FaqApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('faq', 43),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
