import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	canCreateDeviceSoftwareType,
	canReadDeviceSoftwareType,
} from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { SoftwareTypeIcon } from '../shared/AppIcons';

const DeviceSoftwareTypeApp = lazy(() => import('./DeviceSoftwareTypeApp'));

const manifest: AppManifest = {
	id: 'device-software-type',
	name: 'Тип программы',
	version: '1.0.0',
	icon: SoftwareTypeIcon,
	component: DeviceSoftwareTypeApp,
	defaultSize: { width: 400, height: 280 },
	minSize: { width: 320, height: 240 },
	...createDeviceDetailManifestOptions('device-software-type', 2),
	canAccess: () => canReadDeviceSoftwareType() || canCreateDeviceSoftwareType(),
};

export default manifest;
