import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '@/core/api/endpoints/auth';
import * as tokenStorage from '@/core/auth/tokenStorage';

import { isAccessTokenExpired, restoreAccessToken } from '../sessionRestore';

function makeJwt(expSeconds: number): string {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const payload = btoa(JSON.stringify({ exp: expSeconds }));
	return `${header}.${payload}.signature`;
}

describe('sessionRestore', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		tokenStorage.clearTokens();
	});

	it('returns true when access token is still valid', async () => {
		const token = makeJwt(Math.floor(Date.now() / 1000) + 3600);
		tokenStorage.setTokens(token, 'refresh');

		const refreshSpy = vi.spyOn(authApi, 'refreshToken');

		await expect(restoreAccessToken()).resolves.toBe(true);
		expect(refreshSpy).not.toHaveBeenCalled();
	});

	it('refreshes access token when expired', async () => {
		const expired = makeJwt(Math.floor(Date.now() / 1000) - 60);
		tokenStorage.setTokens(expired, 'old-refresh');

		vi.spyOn(authApi, 'refreshToken').mockResolvedValue({
			token: 'new-access',
			refresh_token: 'new-refresh',
		});

		await expect(restoreAccessToken()).resolves.toBe(true);
		expect(tokenStorage.getAccessToken()).toBe('new-access');
		expect(tokenStorage.getRefreshToken()).toBe('new-refresh');
	});

	it('detects expired tokens', () => {
		const expired = makeJwt(Math.floor(Date.now() / 1000) - 10);
		const valid = makeJwt(Math.floor(Date.now() / 1000) + 3600);

		expect(isAccessTokenExpired(expired)).toBe(true);
		expect(isAccessTokenExpired(valid)).toBe(false);
	});
});
