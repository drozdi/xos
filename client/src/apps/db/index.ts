import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSsh } from '@/features/ssh/sshAccess';

import { DbIcon } from './DbIcon';

const DbApp = lazy(() => import('./DbApp'));

const manifest: AppManifest = {
	id: 'db',
	name: 'База',
	version: '1.0.0',
	icon: DbIcon,
	component: DbApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 30,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'ssh',
	checkScopes: false,
	canAccess: () => canUseSsh(),
};

export default manifest;
