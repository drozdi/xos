import { notifications } from '@mantine/notifications';

import { getApiClient } from '@/core/api/client';
import { getAuthStoreActions, useAuthStore } from '@/core/auth/authStore';
import { isAdmin, isAppRoot, isRole, isRoot, canAccessApp, hasFullAppAccess } from '@/core/auth/coreRoles';
import { checkHasScope, getCanScope, getLevelScope } from '@/core/auth/coreScopes';
import { settingManager } from '@/core/settings/SettingManager';
import { getOrCreateWindowApi } from '@/core/windowManager/WindowApi';

import type { CoreApi } from './types';

export function createCoreApi(windowId: string, appId: string): CoreApi {
	const http = getApiClient();

	return {
		windowId,
		appId,
		http: {
			get: http.get.bind(http),
			post: http.post.bind(http),
			put: http.put.bind(http),
			patch: http.patch.bind(http),
			delete: http.delete.bind(http),
		},
		toast: {
			show: (payload) => {
				notifications.show({
					title: payload.title,
					message: payload.message,
					color: payload.color,
				});
			},
			success: (message) => {
				notifications.show({ message, color: 'green' });
			},
			error: (message) => {
				notifications.show({ message, color: 'red' });
			},
			info: (message) => {
				notifications.show({ message, color: 'blue' });
			},
			warning: (message) => {
				notifications.show({ message, color: 'yellow' });
			},
		},
		auth: {
			getUser: () => useAuthStore.getState().user,
			logout: () => getAuthStoreActions().logout(),
		},
		window: getOrCreateWindowApi(windowId),
		roles: {
			isRole,
			isRoot,
			isAdmin,
			isAppRoot,
			canAccessApp,
			hasFullAppAccess,
		},
		scopes: {
			checkHasScope,
			getLevelScope,
			getCanScope,
		},
		settings: settingManager,
	};
}
