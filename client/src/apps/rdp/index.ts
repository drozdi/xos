import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canUseRdp } from '@/features/rdp/rdpAccess';

import { RdpIcon } from './RdpIcon';

const RdpApp = lazy(() => import('./RdpApp'));

const manifest: AppManifest = {
	id: 'rdp',
	name: 'Удалённый рабочий стол',
	version: '1.0.0',
	icon: RdpIcon,
	component: RdpApp,
	defaultSize: { width: 1100, height: 720 },
	minSize: { width: 720, height: 460 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 15,
	taskbarGroup: 'manage',
	singleInstance: false,
	instanceKey: (params) =>
		params?.instanceKey ??
		(params?.props?.connectionId ? `session-${String(params.props.connectionId)}` : 'list'),
	requiredRole: 'rdp',
	checkScopes: false,
	canAccess: () => canUseRdp(),
};

export default manifest;
