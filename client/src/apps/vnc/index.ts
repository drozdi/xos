import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSsh } from '@/features/ssh/sshAccess';

import { VncIcon } from './VncIcon';

const VncApp = lazy(() => import('./VncApp'));

const manifest: AppManifest = {
	id: 'vnc',
	name: 'Стол',
	version: '1.0.0',
	icon: VncIcon,
	component: VncApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 60,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'ssh',
	checkScopes: false,
	canAccess: () => canUseSsh(),
};

export default manifest;
