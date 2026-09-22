import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockElementApp = lazy(() => import('./IblockElementApp'));

const manifest: AppManifest = {
	id: 'iblock-element',
	name: 'Элемент',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockElementApp,
	defaultSize: { width: 560, height: 680 },
	minSize: { width: 420, height: 420 },
	...createIblockDetailManifestOptions('iblock-element', 1),
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
