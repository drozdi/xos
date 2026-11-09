import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSsh } from '@/features/ssh/sshAccess';

import { SftpIcon } from './SftpIcon';

const SftpApp = lazy(() => import('./SftpApp'));

const manifest: AppManifest = {
	id: 'sftp',
	name: 'SFTP',
	version: '1.0.0',
	icon: SftpIcon,
	component: SftpApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 20,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'ssh',
	checkScopes: false,
	canAccess: () => canUseSsh(),
};

export default manifest;
