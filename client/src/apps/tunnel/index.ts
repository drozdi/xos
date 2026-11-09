import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSsh } from '@/features/ssh/sshAccess';

import { TunnelIcon } from './TunnelIcon';

const TunnelApp = lazy(() => import('./TunnelApp'));

const manifest: AppManifest = {
	id: 'tunnel',
	name: 'Туннель',
	version: '1.0.0',
	icon: TunnelIcon,
	component: TunnelApp,
	defaultSize: { width: 860, height: 560 },
	minSize: { width: 640, height: 420 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 40,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'ssh',
	checkScopes: false,
	canAccess: () => canUseSsh(),
};

export default manifest;
