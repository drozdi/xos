import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canReadDeviceLicenseKey } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { LicenseKeyIcon } from '../shared/AppIcons';

const DeviceLicenseKeyApp = lazy(() => import('./DeviceLicenseKeyApp'));

const manifest: AppManifest = {
	id: 'device-license-key',
	name: 'Ключ лицензии',
	version: '1.0.0',
	icon: LicenseKeyIcon,
	component: DeviceLicenseKeyApp,
	defaultSize: { width: 520, height: 480 },
	minSize: { width: 400, height: 400 },
	...createDeviceDetailManifestOptions('device-license-key', 2),
	canAccess: canReadDeviceLicenseKey,
};

export default manifest;
