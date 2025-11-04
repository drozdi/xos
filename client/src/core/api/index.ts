import { AxiosInterceptor } from '../../utils/Axios-Interceptor';

// Базовый URL Symfony бэкенда
export const API_BASE_URL = 'http://localhost:8000/api';
export const ACCESS_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export const api = new AxiosInterceptor({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	message401: 'Signature has expired.',
	accessToken: 'token',
	refreshToken: 'refresh_token',
	accessTokenKey: ACCESS_TOKEN_KEY,
	refreshTokenKey: REFRESH_TOKEN_KEY,
	// urlRefreshToken: '/auth/refreshToken',
	urlRefreshToken: async (refreshToken: string, axios: Axios) => {
		return (
			await axios.post('/token/refresh', {
				refresh_token: refreshToken,
			})
		).data;
	},
});

// Создаем экземпляр Axios
// const api = axios.create({
// 	baseURL: API_BASE_URL,
// 	headers: {
// 		'Content-Type': 'application/json',
// 	},
// });

// // Добавляем интерцептор для автоматической вставки токена
// api.interceptors.request.use(
// 	(config) => {
// 		const token = localStorage.getItem('token');
// 		if (token) {
// 			config.headers.Authorization = `Bearer ${token}`;
// 		}
// 		return config;
// 	},
// 	(error) => {
// 		return Promise.reject(error);
// 	},
// );

// // Добавляем интерцептор для обработки 401 ошибок
// api.interceptors.response.use(
// 	(response) => response,
// 	(error) => {
// 		if (error.response && error.response.status === 401) {
// 			localStorage.removeItem('token');
// 			//window.location = '/login';
// 		}
// 		return Promise.reject(error);
// 	},
// );

export default api;
