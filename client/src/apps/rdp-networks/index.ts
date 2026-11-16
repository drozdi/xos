import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canManageRdpNetworks, canUseRdp } from '@/features/rdp/rdpAccess';

import { RdpNetworksIcon } from './RdpNetworksIcon';

const RdpNetworksApp = lazy(() => import('./RdpNetworksApp'));

const manifest: AppManifest = {
	id: 'rdp-networks',
	name: 'Сети RDP',
	version: '1.0.0',
	icon: RdpNetworksIcon,
	component: RdpNetworksApp,
	defaultSize: { width: 860, height: 640 },
	minSize: { width: 640, height: 420 },
	wmGroup: 'manage',
	startMenuGroup: 'manage',
	startMenuSort: 16,
	taskbarGroup: 'manage',
	singleInstance: true,
	requiredRole: 'rdp',
	checkScopes: false,
	canAccess: () => canUseRdp() && canManageRdpNetworks(),
};

export default manifest;
