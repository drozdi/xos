import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDevice, canReadDevice } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { DeviceIcon } from '../shared/AppIcons';

const DeviceDeviceApp = lazy(() => import('./DeviceDeviceApp'));

const manifest: AppManifest = {
	id: 'device-device',
	name: 'Устройство',
	version: '1.0.0',
	icon: DeviceIcon,
	component: DeviceDeviceApp,
	defaultSize: { width: 560, height: 560 },
	minSize: { width: 400, height: 440 },
	...createDeviceDetailManifestOptions('device-device', 2),
	canAccess: () => canReadDevice() || canCreateDevice(),
};

export default manifest;
