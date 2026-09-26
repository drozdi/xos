import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateIblockElement, canReadIblockElement } from '@/features/iblock/iblockAccess';

import { ContactsIcon } from '../shared/AppIcons';

const ContactsApp = lazy(() => import('./ContactsApp'));

const manifest: AppManifest = {
	id: 'contacts',
	name: 'Контакты',
	version: '1.0.0',
	icon: ContactsIcon,
	component: ContactsApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 560, height: 360 },
	singleInstance: true,
	wmGroup: 'contacts',
	wmSort: 48,
	startMenuSort: 48,
	startMenuGroup: 'content',
	taskbarGroup: 'contacts',
	requiredRole: 'iblock',
	canAccess: () => canReadIblockElement() || canCreateIblockElement(),
};

export default manifest;
