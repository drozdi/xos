import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockProperty, canReadIblockProperty } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { IblockIcon } from '../shared/AppIcons';

const IblockPropertyApp = lazy(() => import('./IblockPropertyApp'));

const manifest: AppManifest = {
	id: 'iblock-property',
	name: 'Свойство инфоблока',
	version: '1.0.0',
	icon: IblockIcon,
	component: IblockPropertyApp,
	defaultSize: { width: 560, height: 680 },
	minSize: { width: 420, height: 420 },
	...createIblockDetailManifestOptions('iblock-property', 1),
	canAccess: () => canReadIblockProperty() || canCreateIblockProperty(),
};

export default manifest;
