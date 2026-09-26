import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { GalleryIcon } from '../shared/AppIcons';

const GalleriesApp = lazy(() => import('./GalleriesApp'));

const manifest: AppManifest = {
	id: 'galleries',
	name: 'Галерея',
	version: '1.0.0',
	icon: GalleryIcon,
	component: GalleriesApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'galleries',
	wmSort: 44,
	startMenuSort: 44,
	startMenuGroup: 'content',
	taskbarGroup: 'galleries',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
