import api from '../api';

// API методы
export const authAPI = {
	login: async (username: string, password: string | number) => {
		return await api.post('/api/login', { username, password });
	},
	getCurrentUser: async () => {
		return await api.get('/api/user');
	},
	getProtectedData: async () => {
		return await api.get('/api/protected');
	},

	getAccountMap: async () => {
		return await api.get('/api/account/map');
	},
	getAccountRoles: async () => {
		return await api.get('/api/account/roles');
	},
	getAccountAccesses: async () => {
		return await api.get('/api/account/accesses');
	},
	getAccountOptions: async () => {
		return await api.get('/api/account/options');
	},
};
