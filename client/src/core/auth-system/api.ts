import api from '../api';

// API методы
export const authAPI = {
	login: async (username: string, password: string | number) => {
		return await api.post('/api/login', { username, password });
	},
	check: async () => {
		//return await api.get('/api/login-check');
		return await api.get('/api/user');
	},
	getProtected: async () => {
		return await api.get('/api/protected');
	},
	getCurrentUser: async () => {
		return await api.get('/api/user');
	},
};
