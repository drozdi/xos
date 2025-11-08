import api from '../api';

export const scopesAPI = {
	getMap: async () => {
		return (await api.get('/account/map')).data;
	},
	getAccesses: async () => {
		return (await api.get('/account/accesses')).data;
	},
};
