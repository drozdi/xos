import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainListManifestOptions } from '@/features/main/mainAppUtils';

import { GroupsIcon } from '../shared/AppIcons';

const MainGroupsApp = lazy(() => import('./MainGroupsApp'));

const manifest: AppManifest = {
	id: 'main-groups',
	name: 'Группы',
	version: '1.0.0',
	icon: GroupsIcon,
	component: MainGroupsApp,
	defaultSize: { width: 800, height: 520 },
	minSize: { width: 560, height: 360 },
	...createMainListManifestOptions('main-group', 1),
};

export default manifest;
