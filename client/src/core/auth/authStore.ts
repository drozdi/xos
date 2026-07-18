import { create } from 'zustand';

import {
	getUser as fetchUser,
	login as loginRequest,
	logout as logoutRequest,
} from '@/core/api/endpoints/auth';
import { getAccesses, getAccountMap } from '@/core/api/endpoints/account';
import { resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { resetScopes, setLevelScopes, setMapScopes } from '@/core/auth/coreScopes';
import * as tokenStorage from '@/core/auth/tokenStorage';
import { resetSettingAdapterState } from '@/core/settings/createSettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';
import { restoreAccessToken } from '@/core/auth/sessionRestore';
import type { LoginRequest, UserSummary } from '@/types/api.types';

let hydrateGeneration = 0;
let activeHydrate: Promise<void> | null = null;

export interface AuthStore {
	user: UserSummary | null;
	scopes: Record<string, number>;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (credentials: LoginRequest) => Promise<void>;
	logout: () => Promise<void>;
	hydrate: () => Promise<void>;
}

async function syncScopesFromApi(): Promise<Record<string, number>> {
	const [accesses, map] = await Promise.all([getAccesses(), getAccountMap()]);
	setLevelScopes(accesses);
	setMapScopes(map);
	return accesses;
}

async function applyUserSession(user: UserSummary): Promise<void> {
	setUserRoles(user.roles);

	let scopes = user.scopes ?? {};
	if (Object.keys(scopes).length === 0) {
		try {
			scopes = await syncScopesFromApi();
		} catch {
			scopes = {};
		}
	} else {
		setLevelScopes(scopes);
		try {
			const map = await getAccountMap();
			setMapScopes(map);
		} catch {
			// map is optional for scope checks until loaded elsewhere
		}
	}

	useAuthStore.setState({
		user,
		scopes,
		isAuthenticated: true,
	});
}

function clearSession(): void {
	tokenStorage.clearTokens();
	resetUserRoles();
	resetScopes();
	resetSettingAdapterState();
	settingManager.reset();
	useAuthStore.setState({
		user: null,
		scopes: {},
		isAuthenticated: false,
		isLoading: false,
	});
}

export const useAuthStore = create<AuthStore>((set) => ({
	user: null,
	scopes: {},
	isAuthenticated: false,
	isLoading: true,

	login: async (credentials) => {
		set({ isLoading: true });
		try {
			const response = await loginRequest(credentials);
			tokenStorage.setTokens(response.token, response.refresh_token);

			const user = response.user ?? (await fetchUser());
			await applyUserSession(user);
		} finally {
			set({ isLoading: false });
		}
	},

	logout: async () => {
		set({ isLoading: true });
		try {
			if (tokenStorage.hasAccessToken()) {
				await logoutRequest();
			}
		} catch {
			// session may already be invalid
		} finally {
			clearSession();
		}
	},

	hydrate: async () => {
		if (activeHydrate) {
			return activeHydrate;
		}

		activeHydrate = (async () => {
			const generation = ++hydrateGeneration;
			set({ isLoading: true });

			if (!tokenStorage.hasStoredSession()) {
				if (generation === hydrateGeneration) {
					set({ isLoading: false, isAuthenticated: false });
				}
				return;
			}

			try {
				const restored = await restoreAccessToken();
				if (!restored) {
					throw new Error('Session restore failed');
				}

				const user = await fetchUser();
				if (generation !== hydrateGeneration) {
					return;
				}

				await applyUserSession(user);
			} catch {
				if (generation === hydrateGeneration) {
					clearSession();
				}
			} finally {
				if (generation === hydrateGeneration) {
					set({ isLoading: false });
				}
			}
		})();

		try {
			await activeHydrate;
		} finally {
			activeHydrate = null;
		}
	},
}));

export function getAuthStoreActions(): Pick<AuthStore, 'logout'> {
	return {
		logout: () => useAuthStore.getState().logout(),
	};
}
