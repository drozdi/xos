import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import { apiClient } from '@/core/api/client';
import * as tokenStorage from '@/core/auth/tokenStorage';

const BASE = '/api';

function withBase(url: string): string {
	if (url.startsWith('/api')) {
		return url;
	}
	if (url.startsWith('/')) {
		return `${BASE}${url}`;
	}
	return `${BASE}/${url}`;
}

/** В окне XOS — desktop-токены; на /inccom — отдельные app-токены. */
function realm(): tokenStorage.AuthRealm {
	return tokenStorage.resolveAuthRealm();
}

class IncComApiAdapter {
	axiosInstance: AxiosInstance = apiClient;

	get<T = unknown>(url: string, config?: AxiosRequestConfig) {
		return apiClient.get<T>(withBase(url), config);
	}

	head<T = unknown>(url: string, config?: AxiosRequestConfig) {
		return apiClient.head<T>(withBase(url), config);
	}

	options<T = unknown>(url: string, config?: AxiosRequestConfig) {
		return apiClient.options<T>(withBase(url), config);
	}

	post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
		return apiClient.post<T>(withBase(url), data, config);
	}

	put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
		return apiClient.put<T>(withBase(url), data, config);
	}

	patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
		return apiClient.patch<T>(withBase(url), data, config);
	}

	delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
		return apiClient.delete<T>(withBase(url), config);
	}

	getAccessToken(): string | null {
		return tokenStorage.getAccessToken(realm());
	}

	getRefreshToken(): string | null {
		return tokenStorage.getRefreshToken(realm());
	}

	setAccessToken(token: string): void {
		const refresh = tokenStorage.getRefreshToken(realm());
		if (refresh) {
			tokenStorage.setTokens(token, refresh, realm());
		} else {
			tokenStorage.setAccessToken(token, realm());
		}
	}

	setRefreshToken(token: string): void {
		const access = tokenStorage.getAccessToken(realm());
		if (access) {
			tokenStorage.setTokens(access, token, realm());
		} else {
			tokenStorage.setRefreshToken(token, realm());
		}
	}

	setTokens(accessToken: string, refreshToken: string): void {
		tokenStorage.setTokens(accessToken, refreshToken, realm());
	}

	clearTokens(): void {
		if (realm() === 'app') {
			tokenStorage.clearTokens('app');
		}
	}

	isRefreshing = false;
	refreshSubscribers: Array<(token: string) => void> = [];
}

export const api = new IncComApiAdapter();

export { queryClient } from './query-client';
