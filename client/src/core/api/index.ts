import axios from 'axios';

// Базовый URL вашего Symfony бэкенда
const API_BASE_URL = 'http://localhost:8000';

// Создаем экземпляр Axios
const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Добавляем интерцептор для автоматической вставки токена
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Добавляем интерцептор для обработки 401 ошибок
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && error.response.status === 401) {
			localStorage.removeItem('token');
			window.location = '/login';
		}
		return Promise.reject(error);
	},
);

// API методы
export const authAPI = {
	login: (username: string, password: string | number) => {
		return api.post('/api/login', { username, password });
	},
	getCurrentUser: () => {
		return api.get('/api/user');
	},
};

export const protectedAPI = {
	getProtectedData: () => {
		return api.get('/api/protected');
	},
};

export default api;
