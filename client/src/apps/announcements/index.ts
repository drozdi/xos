import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { AnnouncementsIcon } from '../shared/AppIcons';

const AnnouncementsApp = lazy(() => import('./AnnouncementsApp'));

const manifest: AppManifest = {
	id: 'announcements',
	name: 'События',
	version: '1.0.0',
	icon: AnnouncementsIcon,
	component: AnnouncementsApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'announcements',
	wmSort: 46,
	startMenuSort: 46,
	startMenuGroup: 'content',
	taskbarGroup: 'announcements',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
