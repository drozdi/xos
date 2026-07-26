import { api } from '@inccom/shared/api';
import { canAccessInccomFromRoles } from '@inccom/inccomAccess';
import { notification } from '@inccom/shared/notification';
import { getterZustandMiddleware } from '@inccom/shared/stores';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { create } from 'zustand';

import {
	mapRegisterResponseToUser,
	requestAuthenticationLogin,
	requestAuthMe,
	requestAuthRegister,
} from '../api/auth';
import type { IRegisterRequest } from '../model/types';

export const useStoreAuth = create<IStoreAuth>(
	getterZustandMiddleware((set, get) => ({
		error: '',
		isLoading: false,
		isAuthenticated: false,
		get isAuth() {
			return !!api.getRefreshToken() && !!api.getAccessToken();
		},
		clearAuth() {
			set({
				isAuthenticated: false,
				isLoading: false,
			});
			api.clearTokens();
		},
		async load() {
			const hasTokens = !!api.getRefreshToken() && !!api.getAccessToken();
			if (!hasTokens) {
				set({ isAuthenticated: false, isLoading: false });
				api.clearTokens();
				return;
			}
			set({ isLoading: true });
			try {
				const me = await requestAuthMe();
				if (!canAccessInccomFromRoles(me.roles)) {
					get().clearAuth();
					return;
				}
				set({ isAuthenticated: true, isLoading: false });
			} catch {
				get().clearAuth();
			}
		},
		async login(username, password) {
			set({
				isLoading: true,
				error: '',
			});
			try {
				const response = await requestAuthenticationLogin({
					username,
					password,
				});
				if (!canAccessInccomFromRoles(response.user?.roles)) {
					notification.error('Нет доступа к приложению «Доходы и расходы»');
					set({ isLoading: false });
					return false;
				}
				api.setTokens(response.token, response.refresh_token);
				set({
					isAuthenticated: true,
					isLoading: false,
				});
				return true;
			} catch (e: unknown) {
				console.error(e);
				const error = getErrorMessage(e, 'Ошибка входа');
				notification.error(error);
				set({
					isLoading: false,
					error,
				});
			}
			return false;
		},
		async register(data: IRegisterRequest) {
			set({
				isLoading: true,
				error: '',
			});
			try {
				const response = await requestAuthRegister(data);
				const user = mapRegisterResponseToUser(response, data);
				const loggedIn = await get().login(data.email || data.login, data.password);
				if (loggedIn) {
					set({ isLoading: false });
					return { user };
				}
				set({ isLoading: false });
				return { user };
			} catch (e: unknown) {
				console.error(e);
				const error = getErrorMessage(e, 'Ошибка регистрации');
				notification.error(error);
				set({
					isLoading: false,
					error,
				});
			}
			return undefined;
		},
		async logout() {
			get().clearAuth();
		},
	})),
);

if (typeof window !== 'undefined') {
	window.addEventListener('xos:app-session-expired', () => {
		useStoreAuth.getState().clearAuth();
	});
}
