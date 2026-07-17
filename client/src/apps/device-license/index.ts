import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceLicense, canReadDeviceLicense } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { LicenseIcon } from '../shared/AppIcons';

const DeviceLicenseApp = lazy(() => import('./DeviceLicenseApp'));

const manifest: AppManifest = {
	id: 'device-license',
	name: 'Лицензия',
	version: '1.0.0',
	icon: LicenseIcon,
	component: DeviceLicenseApp,
	defaultSize: { width: 520, height: 480 },
	minSize: { width: 400, height: 400 },
	...createDeviceDetailManifestOptions('device-license', 2),
	canAccess: () => canReadDeviceLicense() || canCreateDeviceLicense(),
};

export default manifest;
