import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceComponent, canReadDeviceComponent } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { ComponentsIcon } from '../shared/AppIcons';

const DeviceComponentApp = lazy(() => import('./DeviceComponentApp'));

const manifest: AppManifest = {
	id: 'device-component',
	name: 'Тип комплектующих',
	version: '1.0.0',
	icon: ComponentsIcon,
	component: DeviceComponentApp,
	defaultSize: { width: 520, height: 520 },
	minSize: { width: 400, height: 420 },
	...createDeviceDetailManifestOptions('device-component', 2),
	canAccess: () => canReadDeviceComponent() || canCreateDeviceComponent(),
};

export default manifest;
