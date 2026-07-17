import { beforeEach, describe, expect, it } from 'vitest';

import { isAppRoot, isRoot, isScopeRoot, resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { joinScopes, resetScopes, setLevelScopes } from '@/core/auth/coreScopes';

import {
	canCreateDevice,
	canDeleteDevice,
	canLocationDevice,
	canModDevice,
	canReadDevice,
	canReadDeviceLicense,
	canReadDeviceType,
	canUpdateDevice,
} from '@/features/device/deviceAccess';

describe('deviceAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('device', {
			device: {
				can_create: 1,
				can_read: 2,
				can_update: 4,
				can_delete: 8,
				can_mod: 16,
				can_location: 32,
				can_repair: 64,
			},
			type: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			license: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows read for ROLE_DEVICE_ROOT', () => {
		setUserRoles(['ROLE_DEVICE_ROOT']);
		expect(isAppRoot('device')).toBe(true);
		expect(canReadDevice()).toBe(true);
	});

	it('allows read for ROLE_DEVICE_DEVICE_ROOT', () => {
		setUserRoles(['ROLE_DEVICE_DEVICE_ROOT']);
		expect(isScopeRoot('device.device')).toBe(true);
		expect(canReadDevice()).toBe(true);
	});

	it('allows read with can_read.device.device scope', () => {
		setUserRoles(['ROLE_DEVICE']);
		setLevelScopes({ 'device.device': 2 });
		expect(canReadDevice()).toBe(true);
	});

	it('allows location with can_location bit', () => {
		setUserRoles(['ROLE_DEVICE']);
		setLevelScopes({ 'device.device': 32 });
		expect(canLocationDevice()).toBe(true);
		expect(canModDevice()).toBe(false);
	});

	it('allows type read with scope', () => {
		setUserRoles(['ROLE_DEVICE']);
		setLevelScopes({ 'device.type': 2 });
		expect(canReadDeviceType()).toBe(true);
	});

	it('allows license read for ROLE_ROOT', () => {
		setUserRoles(['ROLE_ROOT']);
		expect(isRoot()).toBe(true);
		expect(canReadDeviceLicense()).toBe(true);
	});

	it('denies update without scope', () => {
		setUserRoles(['ROLE_DEVICE']);
		setLevelScopes({ 'device.device': 2 });
		expect(canUpdateDevice()).toBe(false);
		expect(canDeleteDevice()).toBe(false);
	});

	it('allows create with can_create bit', () => {
		setUserRoles(['ROLE_DEVICE']);
		setLevelScopes({ 'device.device': 1 });
		expect(canCreateDevice()).toBe(true);
	});
});
