import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSsh } from '@/features/ssh/sshAccess';

import { DockerIcon } from './DockerIcon';

const DockerApp = lazy(() => import('./DockerApp'));

const manifest: AppManifest = {
	id: 'docker',
	name: 'Docker',
	version: '1.0.0',
	icon: DockerIcon,
	component: DockerApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 50,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'ssh',
	checkScopes: false,
	canAccess: () => canUseSsh(),
};

export default manifest;
