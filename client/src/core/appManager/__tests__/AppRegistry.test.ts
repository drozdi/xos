import { beforeEach, describe, expect, it } from 'vitest';
import { lazy } from 'react';

import { resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';

import { AppRegistry } from '../AppRegistry';
import type { AppManifest } from '../types';

const StubApp = lazy(async () => ({
	default: () => null,
}));

function createManifest(overrides: Partial<AppManifest> = {}): AppManifest {
	return {
		id: 'test-app',
		name: 'Test App',
		version: '1.0.0',
		icon: 'icon',
		component: StubApp,
		defaultSize: { width: 640, height: 480 },
		...overrides,
	};
}

describe('AppRegistry', () => {
	beforeEach(() => {
		AppRegistry.clear();
		resetUserRoles();
	});

	it('returns apps without requiredRole for any user', () => {
		AppRegistry.register(createManifest({ id: 'open' }));
		setUserRoles(['ROLE_USER']);
		expect(AppRegistry.getAvailable().map((app) => app.id)).toEqual(['open']);
	});

	it('filters main apps by module role', () => {
		AppRegistry.register(createManifest({ id: 'main-app', requiredRole: 'main' }));
		AppRegistry.register(createManifest({ id: 'user-app', requiredRole: 'user' }));

		setUserRoles(['ROLE_USER']);
		expect(AppRegistry.getAvailable().map((app) => app.id)).toEqual(['user-app']);

		setUserRoles(['ROLE_MAIN', 'ROLE_USER']);
		expect(AppRegistry.getAvailable().map((app) => app.id)).toEqual(['main-app', 'user-app']);

		setUserRoles(['ROLE_ROOT']);
		expect(AppRegistry.getAvailable().map((app) => app.id)).toEqual(['main-app', 'user-app']);
	});
});
