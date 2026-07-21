import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceType, canReadDeviceType } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { TypesIcon } from '../shared/AppIcons';

const DeviceTypesApp = lazy(() => import('./DeviceTypesApp'));

const manifest: AppManifest = {
	id: 'device-types',
	name: 'Типы устройств',
	version: '1.0.0',
	icon: TypesIcon,
	component: DeviceTypesApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-types', 3),
	startMenuSort: 22,
	canAccess: () => canReadDeviceType() || canCreateDeviceType(),
};

export default manifest;
