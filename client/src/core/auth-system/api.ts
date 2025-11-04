import api from '../api';

// API методы
export const authAPI = {
	login: async (username: string, password: string | number) => {
		return (await api.post('/login', { username, password })).data;
	},
	check: async () => {
		//return await api.get('/login-check');
		return (await api.get('/user')).data;
	},
	getProtected: async () => {
		return (await api.get('/protected')).data;
	},
	getCurrentUser: async () => {
		return (await api.get('/user')).data;
	},
};
