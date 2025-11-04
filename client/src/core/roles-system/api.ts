import api from '../api';

export const rolesAPI = {
	getRoles: async () => {
		return (await api.get('/account/roles')).data;
	},
};
