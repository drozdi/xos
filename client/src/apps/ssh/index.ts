import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseAuthenticatedApps } from '@/core/auth/protectedApps';

import { SshIcon } from './SshIcon';

const SshApp = lazy(() => import('./SshApp'));

const manifest: AppManifest = {
	id: 'ssh',
	name: 'SSH',
	version: '1.0.0',
	icon: SshIcon,
	component: SshApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUseAuthenticatedApps(),
};

export default manifest;
