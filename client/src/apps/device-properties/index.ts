import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceProperty, canReadDeviceProperty } from '@/features/device/deviceAccess';
import { createDeviceListManifestOptions } from '@/features/device/deviceAppUtils';

import { PropertiesIcon } from '../shared/AppIcons';

const DevicePropertiesApp = lazy(() => import('./DevicePropertiesApp'));

const manifest: AppManifest = {
	id: 'device-properties',
	name: 'Свойства',
	version: '1.0.0',
	icon: PropertiesIcon,
	component: DevicePropertiesApp,
	defaultSize: { width: 760, height: 520 },
	minSize: { width: 560, height: 360 },
	...createDeviceListManifestOptions('device-properties', 4),
	startMenuBorderTop: true,
	startMenuSort: 21,
	canAccess: () => canReadDeviceProperty() || canCreateDeviceProperty(),
};

export default manifest;
