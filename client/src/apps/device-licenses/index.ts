import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceLicense, canReadDeviceLicense } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { LicenseIcon } from '../shared/AppIcons';

const DeviceLicensesApp = lazy(() => import('./DeviceLicensesApp'));

const manifest: AppManifest = {
	id: 'device-licenses',
	name: 'Лицензии',
	version: '1.0.0',
	icon: LicenseIcon,
	component: DeviceLicensesApp,
	defaultSize: { width: 800, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-licenses', 8),
	startMenuSort: 33,
	canAccess: () => canReadDeviceLicense() || canCreateDeviceLicense(),
};

export default manifest;
