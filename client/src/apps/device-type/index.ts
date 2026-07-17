import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceType, canReadDeviceType } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { TypesIcon } from '../shared/AppIcons';

const DeviceTypeApp = lazy(() => import('./DeviceTypeApp'));

const manifest: AppManifest = {
	id: 'device-type',
	name: 'Тип устройства',
	version: '1.0.0',
	icon: TypesIcon,
	component: DeviceTypeApp,
	defaultSize: { width: 520, height: 520 },
	minSize: { width: 400, height: 420 },
	...createDeviceDetailManifestOptions('device-type', 2),
	canAccess: () => canReadDeviceType() || canCreateDeviceType(),
};

export default manifest;
