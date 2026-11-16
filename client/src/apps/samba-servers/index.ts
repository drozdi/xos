import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseSamba } from '@/features/samba/sambaAccess';

import { SambaIcon } from './SambaIcon';

const SambaServersApp = lazy(() => import('./SambaServersApp'));

const manifest: AppManifest = {
	id: 'samba-servers',
	name: 'Серверы Samba',
	version: '1.0.0',
	icon: SambaIcon,
	component: SambaServersApp,
	defaultSize: { width: 980, height: 640 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'admin',
	startMenuGroup: 'admin',
	startMenuSort: 40,
	taskbarGroup: 'admin',
	singleInstance: true,
	requiredRole: 'samba',
	checkScopes: false,
	canAccess: () => canUseSamba(),
};

export default manifest;
