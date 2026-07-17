import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceComponent, canReadDeviceComponent } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { ComponentsIcon } from '../shared/AppIcons';

const DeviceComponentsApp = lazy(() => import('./DeviceComponentsApp'));

const manifest: AppManifest = {
	id: 'device-components',
	name: 'Компоненты',
	version: '1.0.0',
	icon: ComponentsIcon,
	component: DeviceComponentsApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-components', 5),
	canAccess: () => canReadDeviceComponent() || canCreateDeviceComponent(),
};

export default manifest;
