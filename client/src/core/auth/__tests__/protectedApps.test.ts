import { describe, expect, it } from 'vitest';

import { setUserRoles, resetUserRoles } from '@/core/auth/coreRoles';
import {
	PROTECTED_APP_MODULES,
	canUseAppModule,
	canUseAuthenticatedApps,
	isProtectedAppModule,
} from '@/core/auth/protectedApps';

describe('protectedApps', () => {
	it('lists protected modules', () => {
		expect(PROTECTED_APP_MODULES).toEqual([
			'main',
			'device',
			'explorer',
			'schooltask',
			'inccom',
		]);
	});

	it('allows public modules for authenticated users', () => {
		setUserRoles(['ROLE_USER']);
		expect(isProtectedAppModule('browser')).toBe(false);
		expect(canUseAuthenticatedApps()).toBe(true);
		expect(canUseAppModule('browser')).toBe(true);
		expect(canUseAppModule('chess')).toBe(true);
		expect(canUseAppModule('inccom')).toBe(false);
		resetUserRoles();
	});

	it('requires module role for protected apps', () => {
		setUserRoles(['ROLE_USER']);
		expect(canUseAppModule('main')).toBe(false);
		expect(canUseAppModule('inccom')).toBe(false);
		setUserRoles(['ROLE_USER', 'ROLE_MAIN']);
		expect(canUseAppModule('main')).toBe(true);
		setUserRoles(['ROLE_USER', 'ROLE_INCCOM']);
		expect(canUseAppModule('inccom')).toBe(true);
		resetUserRoles();
	});
});
