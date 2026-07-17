import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import {
	canCreateDeviceSoftwareType,
	canReadDeviceSoftwareType,
} from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { SoftwareTypeIcon } from '../shared/AppIcons';

const DeviceSoftwareTypesApp = lazy(() => import('./DeviceSoftwareTypesApp'));

const manifest: AppManifest = {
	id: 'device-software-types',
	name: 'Типы программ',
	version: '1.0.0',
	icon: SoftwareTypeIcon,
	component: DeviceSoftwareTypesApp,
	defaultSize: { width: 640, height: 480 },
	minSize: { width: 480, height: 360 },
	...createDeviceListManifestOptions('device-software-types', 7),
	canAccess: () => canReadDeviceSoftwareType() || canCreateDeviceSoftwareType(),
};

export default manifest;
