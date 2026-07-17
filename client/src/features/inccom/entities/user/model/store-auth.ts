import { api } from '@inccom/shared/api';
import { notification } from '@inccom/shared/notification';
import { getterZustandMiddleware } from '@inccom/shared/stores';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { create } from 'zustand';

import type { IRegisterRequest } from '../model/types';

export const useStoreAuth = create<IStoreAuth>(
	getterZustandMiddleware((set) => ({
		error: '',
		isLoading: false,
		isAuthenticated: true,
		get isAuth() {
			return !!api.getAccessToken() && !!api.getRefreshToken();
		},
		clearAuth() {
			set({ isAuthenticated: false });
		},
		async load() {
			set({
				isAuthenticated: !!api.getAccessToken() && !!api.getRefreshToken(),
			});
		},
		async login() {
			return false;
		},
		async register(_data: IRegisterRequest) {
			return undefined;
		},
		async logout() {
			set({ isAuthenticated: false });
		},
	})),
);
