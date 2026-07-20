import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadInccom } from '@/features/inccom/inccomAccess';

import { IncComIcon } from './IncComIcon';

const IncComApp = lazy(() => import('./IncComApp'));

const manifest: AppManifest = {
	id: 'inccom',
	name: 'Доходы и расходы',
	version: '1.0.0',
	icon: IncComIcon,
	component: IncComApp,
	defaultSize: { width: 1200, height: 800 },
	minSize: { width: 900, height: 600 },
	wmGroup: 'inccom',
	startMenuGroup: 'inccom',
	taskbarGroup: 'inccom',
	requiredRole: 'inccom',
	canAccess: canReadInccom,
	singleInstance: true,
};

export default manifest;
