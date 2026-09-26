import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IdeasIcon } from '../shared/AppIcons';

const LeadApp = lazy(() => import('./LeadApp'));

const manifest: AppManifest = {
	id: 'lead',
	name: 'Лид',
	version: '1.0.0',
	icon: IdeasIcon,
	component: LeadApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('lead', 55),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
