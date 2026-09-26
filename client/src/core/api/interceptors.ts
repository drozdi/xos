import { apiBaseURL, apiClient } from '@/core/api/client';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { refreshResponseSchema } from '@/core/api/endpoints/auth';
import {
	createQueuedOfflineError,
	enqueueOutboxItem,
	initOfflineOutbox,
	isAuthBypassPath,
	isMutatingMethod,
	isUnqueueableBody,
} from '@/core/api/offlineOutbox';
import * as tokenStorage from '@/core/auth/tokenStorage';
import { notifications } from '@mantine/notifications';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

interface AuthStoreRef {
	logout: () => Promise<void>;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
	_errorToastShown?: boolean;
	/** Skip 404 toast when missing resource is expected (e.g. optional user_app_data). */
	_silent404?: boolean;
	/** Request was already written to offline outbox. */
	_offlineQueued?: boolean;
	/** Flush replay — do not re-queue. */
	_outboxFlush?: boolean;
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

function resolveRealmForApiUrl(url: string | undefined): tokenStorage.AuthRealm {
	const path = url ?? '';
	if (
		path.includes('/api/IncCom/') ||
		path.includes('/api/schooltask/') ||
		path.includes('/api/calendar/')
	) {
		if (tokenStorage.hasAccessToken('app')) {
			return 'app';
		}
		if (tokenStorage.hasAccessToken('desktop')) {
			return 'desktop';
		}
		return tokenStorage.resolveAuthRealm();
	}
	return tokenStorage.resolveAuthRealm();
}

function isAuthBypassUrl(url: string | undefined): boolean {
	return isAuthBypassPath(url);
}

function shouldConsiderOutbox(config: RetryableRequestConfig | undefined): boolean {
	if (!config || config._outboxFlush || config._offlineQueued) {
		return false;
	}
	if (!isMutatingMethod(config.method)) {
		return false;
	}
	if (isAuthBypassUrl(config.url)) {
		return false;
	}
	return true;
}

async function queueMutatingRequest(
	config: RetryableRequestConfig,
	opts?: { failed?: boolean; failReason?: string },
): Promise<void> {
	config._offlineQueued = true;
	await enqueueOutboxItem(config, opts);
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

	if (error.code === 'ERR_OFFLINE_QUEUED') {
		notifications.show({
			color: 'yellow',
			title: 'Offline',
			message: 'Изменение сохранено в очередь',
			autoClose: 2500,
		});
		return;
	}

	if (error.code === 'ERR_OFFLINE_BINARY') {
		notifications.show({
			color: 'red',
			title: 'Offline',
			message: 'Бинарный запрос нельзя поставить в очередь',
		});
		return;
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
		if (config?._silent404) {
			return;
		}
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

async function performTokenRefresh(requestUrl?: string): Promise<string> {
	const realm = resolveRealmForApiUrl(requestUrl);
	const refreshToken = tokenStorage.getRefreshToken(realm);
	if (!refreshToken) {
		throw new Error('Refresh token missing');
	}
	const { data } = await axios.post<unknown>(
		`${apiBaseURL}/api/token/refresh`,
		{ refresh_token: refreshToken },
		{ headers: { 'Content-Type': 'application/json' } },
	);
	const parsed = refreshResponseSchema.parse(data);
	tokenStorage.setTokens(parsed.token, parsed.refresh_token, realm);
	return parsed.token;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(requestUrl?: string): Promise<string> {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = performTokenRefresh(requestUrl).finally(() => {
		refreshPromise = null;
	});

	return refreshPromise;
}

export function stripJsonContentTypeForFormData(
	config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
	if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
		config.headers.delete('Content-Type');
		config.headers.delete('content-type');
	}
	return config;
}

export function setupInterceptors(authStore: AuthStoreRef): void {
	initOfflineOutbox(apiClient);

	apiClient.interceptors.request.use(async (config) => {
		stripJsonContentTypeForFormData(config);
		const accessToken = tokenStorage.getAccessToken(
			resolveRealmForApiUrl(config.url),
		);
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}

		const retryable = config as RetryableRequestConfig;
		if (
			shouldConsiderOutbox(retryable) &&
			typeof navigator !== 'undefined' &&
			!navigator.onLine
		) {
			if (isUnqueueableBody(config.data)) {
				await queueMutatingRequest(retryable, {
					failed: true,
					failReason: 'binary',
				});
				return Promise.reject(
					new axios.AxiosError(
						'Offline: binary body not queued',
						'ERR_OFFLINE_BINARY',
						config,
					),
				);
			}
			await queueMutatingRequest(retryable);
			return Promise.reject(createQueuedOfflineError(config));
		}

		return config;
	});
	apiClient.interceptors.response.use(
		(response) => response,
		async (error: AxiosError) => {
			const originalRequest = error.config as RetryableRequestConfig | undefined;
			if (
				error.code === 'ERR_OFFLINE_QUEUED' ||
				error.code === 'ERR_OFFLINE_BINARY'
			) {
				showErrorToast(error, originalRequest);
				return Promise.reject(error);
			}
			// Network fail → queue mutating writes (except auth / binary / flush replay)
			if (
				!error.response &&
				shouldConsiderOutbox(originalRequest) &&
				originalRequest
			) {
				if (isUnqueueableBody(originalRequest.data)) {
					await queueMutatingRequest(originalRequest, {
						failed: true,
						failReason: 'binary',
					});
					const binaryErr = new axios.AxiosError(
						'Offline: binary body not queued',
						'ERR_OFFLINE_BINARY',
						originalRequest,
					);
					showErrorToast(binaryErr, originalRequest);
					return Promise.reject(binaryErr);
				}
				await queueMutatingRequest(originalRequest);
				const queued = createQueuedOfflineError(originalRequest);
				showErrorToast(queued, originalRequest);
				return Promise.reject(queued);
			}
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
				const newToken = await refreshAccessToken(originalRequest.url);
				onRefreshed(newToken);
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return apiClient(originalRequest);
			} catch (refreshError) {
				onRefreshFailed(refreshError);
				const isNetworkError =
					axios.isAxiosError(refreshError) && !refreshError.response;
				if (!isNetworkError) {
					const realm = resolveRealmForApiUrl(originalRequest.url);
					if (realm === 'desktop') {
						await authStore.logout();
					} else {
						tokenStorage.clearTokens('app');
						window.dispatchEvent(new Event('xos:app-session-expired'));
					}
				}
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		},
	);
}
