import { beforeEach, describe, expect, it } from 'vitest';

import {
	CORE_ROLES,
	canAccessApp,
	getUserRoles,
	hasFullAppAccess,
	hasRole,
	isAdmin,
	isAppRoot,
	isRole,
	isRoot,
	isScopeRoot,
	resetUserRoles,
	setUserRoles,
	toRolePrefix,
} from '@/core/auth/coreRoles';

describe('coreRoles', () => {
	beforeEach(() => {
		resetUserRoles();
	});

	it('stores and returns user roles', () => {
		setUserRoles(['ROLE_ADMIN', 'ROLE_USER']);
		expect(getUserRoles()).toEqual(['ROLE_ADMIN', 'ROLE_USER']);
	});

	it('normalizes role prefix in isRole', () => {
		setUserRoles(['ROLE_ADMIN']);
		expect(isRole('admin')).toBe(true);
		expect(isRole('ROLE_ADMIN')).toBe(true);
	});

	it('detects root role', () => {
		setUserRoles(['ROLE_ROOT']);
		expect(isRoot()).toBe(true);
		expect(canAccessApp('main')).toBe(true);
	});

	it('detects admin with optional module prefix', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(isAdmin('main')).toBe(true);
		expect(isAdmin()).toBe(false);
		expect(hasFullAppAccess('main')).toBe(false);
	});

	it('detects app root role', () => {
		setUserRoles(['ROLE_MAIN_ROOT']);
		expect(isAppRoot('main')).toBe(true);
		expect(hasFullAppAccess('main')).toBe(true);
	});

	it('detects scope root role', () => {
		setUserRoles(['ROLE_MAIN_OU_ROOT']);
		expect(isScopeRoot('main.ou')).toBe(true);
		expect(isAppRoot('main')).toBe(false);
	});

	it('canAccessApp accepts base, root and admin roles', () => {
		setUserRoles(['ROLE_MAIN']);
		expect(canAccessApp('main')).toBe(true);
		expect(hasFullAppAccess('main')).toBe(false);

		resetUserRoles();
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canAccessApp('main')).toBe(true);
		expect(hasFullAppAccess('main')).toBe(false);

		resetUserRoles();
		setUserRoles(['ROLE_USER']);
		expect(canAccessApp('user')).toBe(true);
		expect(canAccessApp('main')).toBe(false);
	});

	it('toRolePrefix strips ROLE_ prefix', () => {
		expect(toRolePrefix('main')).toBe('MAIN');
		expect(toRolePrefix('ROLE_MAIN')).toBe('MAIN');
	});

	it('checks role membership in array via hasRole', () => {
		expect(hasRole(['ROLE_USER'], CORE_ROLES.USER)).toBe(true);
		expect(hasRole([], CORE_ROLES.ADMIN)).toBe(false);
	});

	it('resets roles on logout flow', () => {
		setUserRoles(['ROLE_ADMIN']);
		resetUserRoles();
		expect(getUserRoles()).toEqual([]);
		expect(isRole('admin')).toBe(false);
	});
});
