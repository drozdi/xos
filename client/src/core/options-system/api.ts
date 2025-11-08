import api from '../api';

export const optionsAPI = {
	getOptions: async () => {
		return (await api.get('/account/options')).data;
	},
};
