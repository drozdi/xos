import { apiBaseURL, apiClient } from '@/core/api/client';
import { refreshResponseSchema } from '@/core/api/endpoints/auth';
import * as tokenStorage from '@/core/auth/tokenStorage';
import { notifications } from '@mantine/notifications';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';



interface AuthStoreRef {
	logout: () => Promise<void>;
}



interface RetryableRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
	_errorToastShown?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void): void {
	refreshSubscribers.push(callback);
}



function onRefreshed(token: string): void {
	refreshSubscribers.forEach((callback) => callback(token));
	refreshSubscribers = [];
}



function onRefreshFailed(): void {
	refreshSubscribers = [];
}



function isAuthBypassUrl(url: string | undefined): boolean {
	if (!url) {
		return false;
	}
	return (
		url.includes('/api/login') ||
		url.includes('/api/token/refresh') ||
		url.includes('/api/logout')
	);
}



function getErrorMessage(error: AxiosError): string {
	if (error.response?.data && typeof error.response.data === 'object') {
		const data = error.response.data as Record<string, unknown>;
		if (typeof data.message === 'string') {
			return data.message;
		}
		if (typeof data.error === 'string') {
			return data.error;
		}
	}

	if (error.message) {
		return error.message;
	}

	return 'Произошла ошибка сети';
}



function showErrorToast(error: AxiosError, config: RetryableRequestConfig | undefined): void {
	if (config?._errorToastShown) {
		return;
	}

	if (config) {
		config._errorToastShown = true;
	}

	if (error.response?.status === 403) {
		notifications.show({
			color: 'red',
			title: 'Ошибка',
			message: 'Доступ запрещён',
		});
		return;
	}

	if (error.response?.status === 500) {
		notifications.show({
			color: 'red',
			title: 'Ошибка сервера',
			message: getErrorMessage(error),
		});
		return;
	}

	if (!error.response) {
		const isNetworkOffline = error.code === 'ERR_NETWORK';
		notifications.show({
			color: 'red',
			title: 'Сеть',
			message: isNetworkOffline
				? 'Сервер недоступен. Проверьте подключение.'
				: getErrorMessage(error),
		});
	}
}



async function performTokenRefresh(): Promise<string> {
	const refreshToken = tokenStorage.getRefreshToken();
	if (!refreshToken) {
		throw new Error('Refresh token missing');
	}
	const { data } = await axios.post<unknown>(
		`${apiBaseURL}/api/token/refresh`,
		{ refresh_token: refreshToken },
		{ headers: { 'Content-Type': 'application/json' } },
	);
	const parsed = refreshResponseSchema.parse(data);
	tokenStorage.setTokens(parsed.token, parsed.refresh_token);
	return parsed.token;

}

export function setupInterceptors(authStore: AuthStoreRef): void {
	apiClient.interceptors.request.use((config) => {
		const accessToken = tokenStorage.getAccessToken();
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	});
	apiClient.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const originalRequest = error.config as RetryableRequestConfig | undefined;
			if (error.response?.status !== 401) {
				showErrorToast(error, originalRequest);
			}
			if (
				error.response?.status !== 401 ||
				!originalRequest ||
				originalRequest._retry ||
				isAuthBypassUrl(originalRequest.url)
			) {
				return Promise.reject(error);
			}
			if (isRefreshing) {
				return new Promise((resolve) => {
					subscribeTokenRefresh((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						originalRequest._retry = true;
						resolve(apiClient(originalRequest));
					});
				});
			}
			originalRequest._retry = true;
			isRefreshing = true;
			try {
				const newToken = await performTokenRefresh();
				onRefreshed(newToken);
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return apiClient(originalRequest);
			} catch (refreshError) {
				onRefreshFailed();
				await authStore.logout();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
}