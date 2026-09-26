import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { GalleryIcon } from '../shared/AppIcons';

const GalleryApp = lazy(() => import('./GalleryApp'));

const manifest: AppManifest = {
	id: 'gallery',
	name: 'Фото',
	version: '1.0.0',
	icon: GalleryIcon,
	component: GalleryApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('gallery', 45),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
