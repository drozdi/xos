import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDevice, canReadDevice } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { DeviceIcon } from '../shared/AppIcons';

const DeviceDevicesApp = lazy(() => import('./DeviceDevicesApp'));

const manifest: AppManifest = {
	id: 'device-devices',
	name: 'Устройства',
	version: '1.0.0',
	icon: DeviceIcon,
	component: DeviceDevicesApp,
	defaultSize: { width: 900, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-devices', 1),
	startMenuSort: 11,
	canAccess: () => canReadDevice() || canCreateDevice(),
};

export default manifest;
