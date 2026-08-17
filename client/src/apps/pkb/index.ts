import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUsePkb } from '@/features/pkb/pkbAccess';

import { PkbIcon } from '../shared/AppIcons';

const PkbApp = lazy(() => import('./PkbApp'));

const manifest: AppManifest = {
	id: 'pkb',
	name: 'База знаний',
	version: '1.0.0',
	icon: PkbIcon,
	component: PkbApp,
	defaultSize: { width: 1000, height: 700 },
	minSize: { width: 640, height: 480 },
	wmGroup: 'tools',
	startMenuGroup: 'tools',
	taskbarGroup: 'tools',
	singleInstance: true,
	canAccess: () => canUsePkb(),
};

export default manifest;
