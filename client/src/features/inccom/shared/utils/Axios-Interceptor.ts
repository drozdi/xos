// @ts-nocheck
import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

import { } from 'react-router-dom';

interface IAxiosInterceptorDefault {
	message401?:
		| string
		| ((
				error: AxiosError<{ detail: string }>,
				axiosInstance: AxiosInstance,
		  ) => Promise<boolean>);
	accessToken?: string;
	refreshToken?: string;
	accessTokenKey?: string;
	refreshTokenKey?: string;
	urlRefreshToken?:
		| string
		| ((refreshToken: string, axiosInstance: AxiosInstance) => Promise<any>);
}

interface IAxiosInterceptorConfig
	extends IAxiosInterceptorDefault, AxiosRequestConfig {
	handleRequest?: (
		config: AxiosRequestConfig,
	) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
	handleResponse?: (error: AxiosError) => any;
}

interface IAxiosInterceptor extends IAxiosInterceptorDefault {
	axiosInstance: AxiosInstance;
	isRefreshing: boolean;
	refreshSubscribers: ((accessToken: string) => void)[];

	// Методы HTTP-запросов
	post: AxiosInstance["post"];
	get: AxiosInstance["get"];
	patch: AxiosInstance["patch"];
	delete: AxiosInstance["delete"];
	head: AxiosInstance["head"];
	options: AxiosInstance["options"];
	put: AxiosInstance["put"];

	// Методы для работы с токенами
	setAccessToken(accessToken: string): void;
	setRefreshToken(refreshToken: string): void;
	setTokens(accessToken: string, refreshToken: string): void;
	getAccessToken(): string | null;
	getRefreshToken(): string | null;
	clearTokens(): void;
	refreshTokens(): Promise<any>;
	_message401(error: AxiosError): Promise<boolean>;
}

export class AxiosInterceptor implements IAxiosInterceptor {
	public axiosInstance: AxiosInstance;
	public isRefreshing = false;
	public refreshSubscribers: ((accessToken: string) => void)[] = [];
	public message401?:
		| string
		| ((error: AxiosError<{ detail: string }>, axiosInstance: AxiosInstance) => Promise<boolean>);
	public accessToken = "access";
	public refreshToken = "refresh";
	public accessTokenKey?: string;
	public refreshTokenKey?: string;
	public urlRefreshToken?:
		| string
		| ((refreshToken: string, axiosInstance: AxiosInstance) => Promise<any>);
	// Методы HTTP-запросов
	public post: AxiosInstance["post"];
	public get: AxiosInstance["get"];
	public patch: AxiosInstance["patch"];
	public delete: AxiosInstance["delete"];
	public head: AxiosInstance["head"];
	public options: AxiosInstance["options"];
	public put: AxiosInstance["put"];
	constructor({
		message401,
		accessToken,
		refreshToken,
		accessTokenKey,
		refreshTokenKey,
		handleRequest,
		handleResponse,
		urlRefreshToken,
		...instanceConfig
	}: IAxiosInterceptorConfig = {}) {
		this.axiosInstance = axios.create({
			...instanceConfig,
		});
		if (message401) {
			this.message401 = message401;
		}
		if (accessToken) {
			this.accessToken = accessToken;
		}
		if (refreshToken) {
			this.refreshToken = refreshToken;
		}
		if (urlRefreshToken) {
			this.urlRefreshToken = urlRefreshToken;
		}

		if (handleResponse) {
			this.axiosInstance.interceptors.response.use(
				(response: AxiosResponse) => response,
				handleResponse,
			);
		}

		if (accessTokenKey) {
			this.accessTokenKey = accessTokenKey;
			this.axiosInstance.interceptors.request.use(
				(config: AxiosRequestConfig) => {
					const accessToken = this.getAccessToken();
					if (accessToken) {
						config.headers.Authorization = `Bearer ${accessToken}`;
					}
					return config;
				},
				(error: AxiosError<{ detail: string }>) => Promise.reject(error),
			);
		}

		if (refreshTokenKey) {
			this.refreshTokenKey = refreshTokenKey;
			this.axiosInstance.interceptors.response.use(
				(response: AxiosResponse) => response,
				async (error: AxiosError<{ detail: string }>) => {
					const originalRequest = error.config as AxiosRequestConfig & {
						_retry?: boolean;
					};
					if (
						error.response &&
						error.response.status === 401 &&
						(await this._message401(error)) &&
						!originalRequest._retry
					) {
						if (!this.isRefreshing) {
							this.isRefreshing = true;
							try {
								const newTokens = await this.refreshTokens();

								this.setAccessToken(newTokens[this.accessToken]);
								this.setRefreshToken(newTokens[this.refreshToken]);

								this.refreshSubscribers.forEach((callback: Function) =>
									callback(this.getAccessToken()),
								);
								this.refreshSubscribers = [];

								return this.axiosInstance(originalRequest);
							} catch (refreshError) {
								console.error(refreshError);
								this.clearTokens();
								this.refreshSubscribers = [];
								window.location.href = '/'
								return Promise.reject(refreshError);
							} finally {
								this.isRefreshing = false;
							}
						}

						return new Promise((resolve) => {
							this.refreshSubscribers.push((newAccessToken: string) => {
								originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
								originalRequest._retry = true;
								resolve(this.axiosInstance(originalRequest));
							});
						});
					}

					return Promise.reject(error);
				},
			);
		}

		if (handleRequest) {
			this.axiosInstance.interceptors.request.use(
				handleRequest,
				(error: AxiosError<{ detail: string }>) => Promise.reject(error),
			);
		}

		this.post = this.axiosInstance.post.bind(this.axiosInstance);
		this.get = this.axiosInstance.get.bind(this.axiosInstance);
		this.patch = this.axiosInstance.patch.bind(this.axiosInstance);
		this.delete = this.axiosInstance.delete.bind(this.axiosInstance);
		this.head = this.axiosInstance.head.bind(this.axiosInstance);
		this.options = this.axiosInstance.options.bind(this.axiosInstance);
		this.put = this.axiosInstance.put.bind(this.axiosInstance);
	}
	async _message401(error: AxiosError<{ detail: string, message?: string }>): Promise<boolean> {
		if (!this.message401) {
			return true;
		}
		if (typeof this.message401 === "function") {
			return await this.message401(error, this.axiosInstance);
		}
		return error.response?.data?.message === this.message401;
	}
	setAccessToken(accessToken: string): void {
		if (this.accessTokenKey) {
			localStorage.setItem(this.accessTokenKey, accessToken);
		}
	}
	setRefreshToken(refreshToken: string): void {
		if (this.refreshTokenKey) {
			localStorage.setItem(this.refreshTokenKey, refreshToken);
		}
	}
	setTokens(accessToken: string, refreshToken: string): void {
		this.setAccessToken(accessToken);
		this.setRefreshToken(refreshToken);
	}
	getAccessToken(): string | null {
		if (this.accessTokenKey) {
			return localStorage.getItem(this.accessTokenKey);
		}
		return null;
	}
	getRefreshToken(): string | null {
		if (this.refreshTokenKey) {
			return localStorage.getItem(this.refreshTokenKey);
		}
		return null;
	}
	clearTokens(): void {
		if (this.accessTokenKey) {
			localStorage.removeItem(this.accessTokenKey);
		}
		if (this.refreshTokenKey) {
			localStorage.removeItem(this.refreshTokenKey);
		}
	}
	async refreshTokens(): Promise<any> {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error("No refresh token available");
		}
		if (typeof this.urlRefreshToken === "function") {
			return await this.urlRefreshToken(refreshToken, this.axiosInstance);
		} else if (typeof this.urlRefreshToken === "string") {
			return (
				await this.axiosInstance.post(this.urlRefreshToken, {
					refreshToken,
				})
			).data;
		}
		throw new Error("No valid URL or function provided for token refresh");
	}
}
