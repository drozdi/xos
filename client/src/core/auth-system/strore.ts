import { create } from 'zustand';
import roles from '../roles-system';
import scopes from '../scopes-system';
import { loadAccc } from './../account-system/index';
import { authAPI } from './api';

interface authStoreProps {
	isAuth: boolean;
	loading: boolean;
	user?: string;
	init(): void;
	login(val: { login: string; password: string }): void;
	loadUser(): void;
	logout(): void;
	loadAccc(): void;
}

export const useAuthSystem = create<authStoreProps>((set, get) => ({
	isAuth: false,
	loading: false,
	user: '',
	init: async () => {
		return authAPI
			.getProtected()
			.then(get().loadAccc)
			.then(() => {
				set({
					isAuth: true,
					loading: false,
				});
			});
	},
	login: async ({ login, password }) => {
		const response = await authAPI.login(login, password).then(async (response) => {
			if (response.status === 200) {
				localStorage.setItem('token', response.data.token);
				const userResponse = await authAPI.getCurrentUser();
				set({ isAuth: true, user: userResponse.data.user });
				loadAccc();
			}
			return response;
		});
		return response;
	},
	loadUser: async () => {},
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
