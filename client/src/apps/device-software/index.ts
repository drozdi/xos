import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceSoftware, canReadDeviceSoftware } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { SoftwareIcon } from '../shared/AppIcons';

const DeviceSoftwareApp = lazy(() => import('./DeviceSoftwareApp'));

const manifest: AppManifest = {
	id: 'device-software',
	name: 'Программа',
	version: '1.0.0',
	icon: SoftwareIcon,
	component: DeviceSoftwareApp,
	defaultSize: { width: 440, height: 360 },
	minSize: { width: 360, height: 300 },
	...createDeviceDetailManifestOptions('device-software', 2),
	canAccess: () => canReadDeviceSoftware() || canCreateDeviceSoftware(),
};

export default manifest;
