import { lazy } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import { canCreateDeviceProperty, canReadDeviceProperty } from '@/features/device/deviceAccess';
import { createDeviceDetailManifestOptions } from '@/features/device/deviceAppUtils';

import { PropertiesIcon } from '../shared/AppIcons';

const DevicePropertyApp = lazy(() => import('./DevicePropertyApp'));

const manifest: AppManifest = {
	id: 'device-property',
	name: 'Свойство',
	version: '1.0.0',
	icon: PropertiesIcon,
	component: DevicePropertyApp,
	defaultSize: { width: 520, height: 520 },
	minSize: { width: 400, height: 420 },
	...createDeviceDetailManifestOptions('device-property', 2),
	canAccess: () => canReadDeviceProperty() || canCreateDeviceProperty(),
};

export default manifest;
