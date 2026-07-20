import { apiBaseURL, apiClient } from '@/core/api/client';
import { extractApiErrorMessage } from '@/core/api/apiError';
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
let refreshSubscribers: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

function subscribeTokenRefresh(
	resolve: (token: string) => void,
	reject: (error: unknown) => void,
): void {
	refreshSubscribers.push({ resolve, reject });
}

function onRefreshed(token: string): void {
	refreshSubscribers.forEach(({ resolve }) => resolve(token));
	refreshSubscribers = [];
}

function onRefreshFailed(error: unknown): void {
	refreshSubscribers.forEach(({ reject }) => reject(error));
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
	return extractApiErrorMessage(error, 'Произошла ошибка сети');
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
			title: 'Доступ запрещён',
			message: getErrorMessage(error),
		});
		return;
	}

	if (error.response?.status === 404) {
		notifications.show({
			color: 'red',
			title: 'Не найдено',
			message: getErrorMessage(error),
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

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = performTokenRefresh().finally(() => {
		refreshPromise = null;
	});

	return refreshPromise;
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
				return new Promise((resolve, reject) => {
					subscribeTokenRefresh((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						originalRequest._retry = true;
						resolve(apiClient(originalRequest));
					}, reject);
				});
			}
			originalRequest._retry = true;
			isRefreshing = true;
			try {
				const newToken = await refreshAccessToken();
				onRefreshed(newToken);
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return apiClient(originalRequest);
			} catch (refreshError) {
				onRefreshFailed(refreshError);
				const isNetworkError =
					axios.isAxiosError(refreshError) && !refreshError.response;
				if (!isNetworkError) {
					await authStore.logout();
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
}