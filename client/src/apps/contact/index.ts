import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';
import { createIblockDetailManifestOptions } from '@/features/iblock/iblockAppUtils';

import { ContactsIcon } from '../shared/AppIcons';

const ContactApp = lazy(() => import('./ContactApp'));

const manifest: AppManifest = {
	id: 'contact',
	name: 'Контакт',
	version: '1.0.0',
	icon: ContactsIcon,
	component: ContactApp,
	defaultSize: { width: 720, height: 720 },
	minSize: { width: 480, height: 420 },
	...createIblockDetailManifestOptions('contact', 49),
	startMenuGroup: 'content',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
