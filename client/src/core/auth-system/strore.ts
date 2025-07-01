import { create } from 'zustand';
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
		const response = await authAPI.login(login, password).then(async (response) => {
			if (response.status === 200) {
				localStorage.setItem('token', response.data.token);
				await get().load();
				set({ isAuth: true, loading: false });
			}
			return response;
		});
		return response;
	},
	logout: async () => {
		localStorage.removeItem('token');
	},
	load: async () => {
		return Promise.all([coreRoles.load(), coreScopes.load(), coreOptions.load()]);
	},
}));
