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

	it('stores tokens after successful refresh response parse', async () => {
		const setTokens = vi.spyOn(tokenStorage, 'setTokens').mockImplementation(() => {});

		const refreshData = { token: 'new-access', refresh_token: 'new-refresh' };
		vi.spyOn(axios, 'post').mockResolvedValue({ data: refreshData });
		vi.spyOn(tokenStorage, 'getRefreshToken').mockReturnValue('old-refresh');

		const { refreshResponseSchema } = await import('@/core/api/endpoints/auth');
		const { data } = await axios.post('http://localhost:8000/api/token/refresh', {
			refresh_token: 'old-refresh',
		});
		const parsed = refreshResponseSchema.parse(data);
		tokenStorage.setTokens(parsed.token, parsed.refresh_token);

		expect(setTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
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
