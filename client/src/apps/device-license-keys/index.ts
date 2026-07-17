import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadDeviceLicenseKey } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { LicenseKeyIcon } from '../shared/AppIcons';

const DeviceLicenseKeysApp = lazy(() => import('./DeviceLicenseKeysApp'));

const manifest: AppManifest = {
	id: 'device-license-keys',
	name: 'Ключи лицензий',
	version: '1.0.0',
	icon: LicenseKeyIcon,
	component: DeviceLicenseKeysApp,
	defaultSize: { width: 640, height: 480 },
	minSize: { width: 480, height: 360 },
	...createDeviceListManifestOptions('device-license-keys', 9),
	canAccess: canReadDeviceLicenseKey,
};

export default manifest;
