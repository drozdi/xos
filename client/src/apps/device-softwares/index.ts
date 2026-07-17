import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceSoftware, canReadDeviceSoftware } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { SoftwareIcon } from '../shared/AppIcons';

const DeviceSoftwaresApp = lazy(() => import('./DeviceSoftwaresApp'));

const manifest: AppManifest = {
	id: 'device-softwares',
	name: 'Программы',
	version: '1.0.0',
	icon: SoftwareIcon,
	component: DeviceSoftwaresApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-softwares', 6),
	canAccess: () => canReadDeviceSoftware() || canCreateDeviceSoftware(),
};

export default manifest;
