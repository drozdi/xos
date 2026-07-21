import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSubDevice, canReadSubDevice } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { SubDeviceIcon } from '../shared/AppIcons';

const DeviceSubDevicesApp = lazy(() => import('./DeviceSubDevicesApp'));

const manifest: AppManifest = {
	id: 'device-sub-devices',
	name: 'Комплектующие',
	version: '1.0.0',
	icon: SubDeviceIcon,
	component: DeviceSubDevicesApp,
	defaultSize: { width: 860, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-sub-devices', 2),
	startMenuSort: 12,
	canAccess: () => canReadSubDevice() || canCreateSubDevice(),
};

export default manifest;
