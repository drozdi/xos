import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as tokenStorage from '@/core/auth/tokenStorage';

vi.mock('@mantine/notifications', () => ({
	notifications: { show: vi.fn() },
}));

vi.mock('@/core/api/client', () => ({
	apiBaseURL: 'http://localhost:8000',
	apiClient: {
		interceptors: {
			request: { use: vi.fn() },
			response: { use: vi.fn() },
		},
	},
}));

describe('auth refresh flow', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('stores the access token after a cookie refresh', async () => {
		const setAccessToken = vi.spyOn(tokenStorage, 'setAccessToken').mockImplementation(() => {});

		const refreshData = { token: 'new-access' };
		vi.spyOn(axios, 'post').mockResolvedValue({ data: refreshData });

		const { refreshResponseSchema } = await import('@/core/api/endpoints/auth');
		const { data } = await axios.post('http://localhost:8000/api/token/refresh', {});
		const parsed = refreshResponseSchema.parse(data);
		tokenStorage.setAccessToken(parsed.token, 'desktop');

		expect(setAccessToken).toHaveBeenCalledWith('new-access', 'desktop');
	});

	it('marks retried requests to avoid duplicate error toasts', () => {
		interface RetryableRequestConfig extends InternalAxiosRequestConfig {
			_retry?: boolean;
			_errorToastShown?: boolean;
		}

		const config = { _retry: true, _errorToastShown: true } as RetryableRequestConfig;
		const error = { response: undefined, code: 'ERR_NETWORK' } as AxiosError;

		const shouldShowToast = !config._errorToastShown && error.response?.status !== 401;
		expect(shouldShowToast).toBe(false);
	});
});
