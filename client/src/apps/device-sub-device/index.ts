import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateSubDevice, canReadSubDevice } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { SubDeviceIcon } from '../shared/AppIcons';

const DeviceSubDeviceApp = lazy(() => import('./DeviceSubDeviceApp'));

const manifest: AppManifest = {
	id: 'device-sub-device',
	name: 'Комплектующее',
	version: '1.0.0',
	icon: SubDeviceIcon,
	component: DeviceSubDeviceApp,
	defaultSize: { width: 520, height: 520 },
	minSize: { width: 400, height: 420 },
	...createDeviceDetailManifestOptions('device-sub-device', 2),
	canAccess: () => canReadSubDevice() || canCreateSubDevice(),
};

export default manifest;
