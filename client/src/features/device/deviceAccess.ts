import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

function canDeviceScope(scopePath: string, actionScope: string): boolean {
	if (!canAccessApp('device')) {
		return false;
	}
	if (isRoot() || isAppRoot('device') || isScopeRoot(scopePath)) {
		return true;
	}

	return Boolean(getLevelScope(scopePath) & getCanScope(actionScope));
}

function useDeviceAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

function createDeviceCrudAccess(scopePath: string) {
	const can = (action: string) => canDeviceScope(scopePath, `${action}.${scopePath}`);

	return {
		canRead: () => can('can_read'),
		canCreate: () => can('can_create'),
		canUpdate: () => can('can_update'),
		canDelete: () => can('can_delete'),
		useCanRead: () => useDeviceAccess(() => can('can_read')),
		useCanCreate: () => useDeviceAccess(() => can('can_create')),
		useCanUpdate: () => useDeviceAccess(() => can('can_update')),
		useCanDelete: () => useDeviceAccess(() => can('can_delete')),
	};
}

const DEVICE_SCOPE = 'device.device';
const SUB_DEVICE_SCOPE = 'device.subDevice';
const TYPE_SCOPE = 'device.type';
const PROPERTY_SCOPE = 'device.property';
const COMPONENT_SCOPE = 'device.component';
const SOFTWARE_SCOPE = 'device.software';
const SOFTWARE_TYPE_SCOPE = 'device.software.type';
const LICENSE_SCOPE = 'device.license';

const deviceCrud = createDeviceCrudAccess(DEVICE_SCOPE);
const subDeviceCrud = createDeviceCrudAccess(SUB_DEVICE_SCOPE);
const typeCrud = createDeviceCrudAccess(TYPE_SCOPE);
const propertyCrud = createDeviceCrudAccess(PROPERTY_SCOPE);
const componentCrud = createDeviceCrudAccess(COMPONENT_SCOPE);
const softwareCrud = createDeviceCrudAccess(SOFTWARE_SCOPE);
const softwareTypeCrud = createDeviceCrudAccess(SOFTWARE_TYPE_SCOPE);
const licenseCrud = createDeviceCrudAccess(LICENSE_SCOPE);

export const canReadDevice = deviceCrud.canRead;
export const canCreateDevice = deviceCrud.canCreate;
export const canUpdateDevice = deviceCrud.canUpdate;
export const canDeleteDevice = deviceCrud.canDelete;
export const useCanReadDevice = deviceCrud.useCanRead;
export const useCanCreateDevice = deviceCrud.useCanCreate;
export const useCanUpdateDevice = deviceCrud.useCanUpdate;
export const useCanDeleteDevice = deviceCrud.useCanDelete;

export function canModDevice(): boolean {
	return canDeviceScope(DEVICE_SCOPE, `can_mod.${DEVICE_SCOPE}`);
}

export function canLocationDevice(): boolean {
	return canDeviceScope(DEVICE_SCOPE, `can_location.${DEVICE_SCOPE}`);
}

export function canRepairDevice(): boolean {
	return canDeviceScope(DEVICE_SCOPE, `can_repair.${DEVICE_SCOPE}`);
}

export function useCanModDevice(): boolean {
	return useDeviceAccess(canModDevice);
}

export function useCanLocationDevice(): boolean {
	return useDeviceAccess(canLocationDevice);
}

export function useCanRepairDevice(): boolean {
	return useDeviceAccess(canRepairDevice);
}

export const canReadSubDevice = subDeviceCrud.canRead;
export const canCreateSubDevice = subDeviceCrud.canCreate;
export const canUpdateSubDevice = subDeviceCrud.canUpdate;
export const canDeleteSubDevice = subDeviceCrud.canDelete;
export const useCanReadSubDevice = subDeviceCrud.useCanRead;
export const useCanCreateSubDevice = subDeviceCrud.useCanCreate;
export const useCanUpdateSubDevice = subDeviceCrud.useCanUpdate;
export const useCanDeleteSubDevice = subDeviceCrud.useCanDelete;

export function canModSubDevice(): boolean {
	return canDeviceScope(SUB_DEVICE_SCOPE, `can_mod.${SUB_DEVICE_SCOPE}`);
}

export function useCanModSubDevice(): boolean {
	return useDeviceAccess(canModSubDevice);
}

export const canReadDeviceType = typeCrud.canRead;
export const canCreateDeviceType = typeCrud.canCreate;
export const canUpdateDeviceType = typeCrud.canUpdate;
export const canDeleteDeviceType = typeCrud.canDelete;
export const useCanReadDeviceType = typeCrud.useCanRead;
export const useCanCreateDeviceType = typeCrud.useCanCreate;
export const useCanUpdateDeviceType = typeCrud.useCanUpdate;
export const useCanDeleteDeviceType = typeCrud.useCanDelete;

export const canReadDeviceProperty = propertyCrud.canRead;
export const canCreateDeviceProperty = propertyCrud.canCreate;
export const canUpdateDeviceProperty = propertyCrud.canUpdate;
export const canDeleteDeviceProperty = propertyCrud.canDelete;
export const useCanReadDeviceProperty = propertyCrud.useCanRead;
export const useCanCreateDeviceProperty = propertyCrud.useCanCreate;
export const useCanUpdateDeviceProperty = propertyCrud.useCanUpdate;
export const useCanDeleteDeviceProperty = propertyCrud.useCanDelete;

export const canReadDeviceComponent = componentCrud.canRead;
export const canCreateDeviceComponent = componentCrud.canCreate;
export const canUpdateDeviceComponent = componentCrud.canUpdate;
export const canDeleteDeviceComponent = componentCrud.canDelete;
export const useCanReadDeviceComponent = componentCrud.useCanRead;
export const useCanCreateDeviceComponent = componentCrud.useCanCreate;
export const useCanUpdateDeviceComponent = componentCrud.useCanUpdate;
export const useCanDeleteDeviceComponent = componentCrud.useCanDelete;

export const canReadDeviceSoftware = softwareCrud.canRead;
export const canCreateDeviceSoftware = softwareCrud.canCreate;
export const canUpdateDeviceSoftware = softwareCrud.canUpdate;
export const canDeleteDeviceSoftware = softwareCrud.canDelete;
export const useCanReadDeviceSoftware = softwareCrud.useCanRead;
export const useCanCreateDeviceSoftware = softwareCrud.useCanCreate;
export const useCanUpdateDeviceSoftware = softwareCrud.useCanUpdate;
export const useCanDeleteDeviceSoftware = softwareCrud.useCanDelete;

export const canReadDeviceSoftwareType = softwareTypeCrud.canRead;
export const canCreateDeviceSoftwareType = softwareTypeCrud.canCreate;
export const canUpdateDeviceSoftwareType = softwareTypeCrud.canUpdate;
export const canDeleteDeviceSoftwareType = softwareTypeCrud.canDelete;
export const useCanReadDeviceSoftwareType = softwareTypeCrud.useCanRead;
export const useCanCreateDeviceSoftwareType = softwareTypeCrud.useCanCreate;
export const useCanUpdateDeviceSoftwareType = softwareTypeCrud.useCanUpdate;
export const useCanDeleteDeviceSoftwareType = softwareTypeCrud.useCanDelete;

export const canReadDeviceLicense = licenseCrud.canRead;
export const canCreateDeviceLicense = licenseCrud.canCreate;
export const canUpdateDeviceLicense = licenseCrud.canUpdate;
export const canDeleteDeviceLicense = licenseCrud.canDelete;
export const useCanReadDeviceLicense = licenseCrud.useCanRead;
export const useCanCreateDeviceLicense = licenseCrud.useCanCreate;
export const useCanUpdateDeviceLicense = licenseCrud.useCanUpdate;
export const useCanDeleteDeviceLicense = licenseCrud.useCanDelete;

export const canReadDeviceLicenseKey = licenseCrud.canRead;
export const canUpdateDeviceLicenseKey = licenseCrud.canUpdate;
export const useCanReadDeviceLicenseKey = licenseCrud.useCanRead;
export const useCanUpdateDeviceLicenseKey = licenseCrud.useCanUpdate;
