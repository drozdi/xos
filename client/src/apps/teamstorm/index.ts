import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { TeamStormIcon } from '../shared/AppIcons';
import { canUseTeamStorm } from '@/features/teamstorm/teamstormAccess';

const TeamStormApp = lazy(() => import('./TeamStormApp'));

const manifest: AppManifest = {
	id: 'teamstorm',
	name: 'TeamStorm',
	version: '1.0.0',
	icon: TeamStormIcon,
	component: TeamStormApp,
	defaultSize: { width: 900, height: 700 },
	minSize: { width: 640, height: 480 },
	wmGroup: 'ts',
	startMenuGroup: 'ts',
	taskbarGroup: 'ts',
	requiredRole: 'ts',
	canAccess: () => canUseTeamStorm(),
	singleInstance: true,
};

export default manifest;
