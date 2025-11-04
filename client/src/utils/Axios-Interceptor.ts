import axios from 'axios';

interface IAxiosInterceptorDeafult {
	message401?: string;
	accessToken?: string;
	refreshToken?: string;
	selectToken?: Function;
	accessTokenKey?: string;
	refreshTokenKey?: string;
	urlRefreshToken?: string | Function;
}

interface IAxiosInterceptorConfig extends IAxiosInterceptorDeafult, CreateAxiosDefaults {
	handleRequest?: Function;
	handleResponse?: Function;
}

interface IAxiosInterceptor extends Axios, IAxiosInterceptorDeafult {
	axiosInstance: AxiosInstance;
	isRefreshing: boolean;
	refreshSubscribers: ((accessToken: string) => void)[];
	// post: Function
	// get: Function
	// patch: Function
	// delete: Function
	// head: Function
	// options: Function
	// put: Function
}

export class AxiosInterceptor implements IAxiosInterceptor {
	axiosInstance: AxiosInstance;
	isRefreshing: boolean = false;
	refreshSubscribers: ((accessToken: string) => void)[] = [];
	message401?: string;
	accessToken?: string = 'access';
	refreshToken?: string = 'refresh';
	accessTokenKey?: string;
	refreshTokenKey?: string;
	urlRefreshToken?: string | Function;
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
				(response) => response,
				handleResponse,
			);
		}

		if (accessTokenKey) {
			this.accessTokenKey = accessTokenKey;
			this.axiosInstance.interceptors.request.use(
				(config) => {
					const accessToken = this.getAccessToken();
					if (accessToken) {
						config.headers.Authorization = `Bearer ${accessToken}`;
					}
					return config;
				},
				(error) => Promise.reject(error),
			);
		}

		if (refreshTokenKey) {
			this.refreshTokenKey = refreshTokenKey;
			this.axiosInstance.interceptors.response.use(
				(response) => response,
				async (error) => {
					const originalRequest = error.config;

					if (
						error.response &&
						error.response.status === 401 &&
						!originalRequest._retry
					) {
						if (!this.isRefreshing) {
							this.isRefreshing = true;

							try {
								const newTokens = await this.refreshTokens();

								this.setAccessToken(newTokens[this.accessToken]);
								this.setRefreshToken(newTokens[this.refreshToken]);

								this.refreshSubscribers.forEach((callback) =>
									callback(newTokens[this.accessToken]),
								);
								this.refreshSubscribers = [];

								return this.axiosInstance(originalRequest);
							} catch (refreshError) {
								this.clearTokens();
								this.refreshSubscribers = [];
								return Promise.reject(refreshError);
							} finally {
								this.isRefreshing = false;
							}
						}

						return new Promise((resolve) => {
							this.refreshSubscribers.push((newAccessToken) => {
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
			this.axiosInstance.interceptors.request.use(handleRequest, (error) =>
				Promise.reject(error),
			);
		}

		['delete', 'get', 'head', 'options', 'post', 'put', 'patch'].forEach((method) => {
			this[method] = this.axiosInstance[method].bind(this.axiosInstance);
		});
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
	async refreshTokens() {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}
		if (typeof this.urlRefreshToken === 'function') {
			return await this.urlRefreshToken(refreshToken, this.axiosInstance);
		} else if (typeof this.urlRefreshToken === 'string') {
			const response = await this.axiosInstance.post(this.urlRefreshToken, {
				refreshToken,
			});
			return response.data;
		}
	}
}
