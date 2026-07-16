import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { createMainDetailManifestOptions } from '@/features/main/mainAppUtils';

import { GroupsIcon } from '../shared/AppIcons';

const MainGroupApp = lazy(() => import('./MainGroupApp'));

const manifest: AppManifest = {
	id: 'main-group',
	name: 'Группа',
	version: '1.0.0',
	icon: GroupsIcon,
	component: MainGroupApp,
	defaultSize: { width: 480, height: 520 },
	minSize: { width: 360, height: 400 },
	...createMainDetailManifestOptions('main-group', 2),
};

export default manifest;
