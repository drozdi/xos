import api from '../api';

export const scopesAPI = {
	getMap: async () => {
		return await api.get('/api/account/map');
	},
	getAccesses: async () => {
		return await api.get('/api/account/accesses');
	},
};
