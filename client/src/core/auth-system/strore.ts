import { create } from 'zustand';
import roles from '../roles-system';
import scopes from '../scopes-system';
import { authAPI } from './api';

interface authStoreProps {
	isAuth: boolean;
	loading: boolean;
	user?: string;
	login(val: { login: string; password: string }): void;
	loadUser(): void;
	logout(): void;
}

export const useAuthSystem = create<authStoreProps>((set, get) => ({
	isAuth: false,
	loading: false,
	user: '',
	login: async ({ login, password }) => {
		const response = await authAPI.login(login, password).then(async (response) => {
			if (response.status === 200) {
				localStorage.setItem('token', response.data.token);
				const userResponse = await authAPI.getCurrentUser();
				set({ isAuth: true, user: userResponse.data.user });
				get().loadAccc();
			}
			return response;
		});
		return response;
	},
	loadUser: async () => {
		try {
			const response = await authAPI.getCurrentUser();
			set({ isAuth: true, user: response.data.user });
		} catch (error) {
			set({ isAuth: false });
		} finally {
			set({ loading: false });
		}
	},
	logout: async () => {
		localStorage.removeItem('token');
	},
	loadAccc: async () => {
		return Promise.all([
			authAPI.getAccountMap().then(({ data }) => {
				for (let k in data) {
					scopes.joinScopes(k, data[k]);
				}
				return data;
			}),
			authAPI.getAccountRoles().then(({ data }) => {
				roles.joinRole(data || []);
				return data;
			}),
			authAPI.getAccountAccesses().then(({ data }) => {
				scopes.joinLevel(data || {});
				return data;
			}),
			authAPI.getAccountOptions().then(({ data }) => {
				//console.log(data)
				return data;
			}),
		]);
	},
}));
