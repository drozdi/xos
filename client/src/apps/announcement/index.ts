import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { AnnouncementsIcon } from '../shared/AppIcons';

const AnnouncementApp = lazy(() => import('./AnnouncementApp'));

const manifest: AppManifest = {
	id: 'announcement',
	name: 'Событие',
	version: '1.0.0',
	icon: AnnouncementsIcon,
	component: AnnouncementApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('announcement', 47),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
