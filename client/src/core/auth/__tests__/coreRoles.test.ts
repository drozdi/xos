import { beforeEach, describe, expect, it } from 'vitest';

import {
	CORE_ROLES,
	getUserRoles,
	hasRole,
	isAdmin,
	isRole,
	isRoot,
	resetUserRoles,
	setUserRoles,
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
	});

	it('detects admin with optional module prefix', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(isAdmin('main')).toBe(true);
		expect(isAdmin()).toBe(false);
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
