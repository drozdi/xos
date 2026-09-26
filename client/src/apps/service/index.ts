import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { ServicesIcon } from '../shared/AppIcons';

const ServiceApp = lazy(() => import('./ServiceApp'));

const manifest: AppManifest = {
	id: 'service',
	name: 'Услуга',
	version: '1.0.0',
	icon: ServicesIcon,
	component: ServiceApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('service', 51),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
