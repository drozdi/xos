import { create } from 'zustand';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api';
import coreOptions from '../options-system';
import coreRoles from '../roles-system';
import coreScopes from '../scopes-system';
import { authAPI } from './api';

interface authStoreProps {
	isAuth: boolean;
	loading: boolean;
	user?: string;
	init(): void;
	login(val: { login: string; password: string }): void;
	logout(): void;
	load(): void;
}

export const useAuthSystem = create<authStoreProps>((set, get) => ({
	isAuth: false,
	loading: false,
	user: '',
	init: async () => {
		set({
			isAuth: false,
			loading: true,
		});
		return authAPI
			.check()
			.then(get().load)
			.then(() => {
				set({
					isAuth: true,
					loading: false,
				});
			});
	},
	login: async ({ login, password }) => {
		return await authAPI.login(login, password).then(async (response) => {
			localStorage.setItem(ACCESS_TOKEN_KEY, response.token);
			localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
			console.log(response);
			await get().load();
			return response;
		});
	},
	logout: async () => {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	},
	load: async () => {
		return Promise.all([coreRoles.load(), coreScopes.load(), coreOptions.load()]);
	},
}));
