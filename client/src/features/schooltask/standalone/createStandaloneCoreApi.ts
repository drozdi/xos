import { notifications } from '@mantine/notifications';

import { getApiClient } from '@/core/api/client';
import { useAuthStore } from '@/core/auth/authStore';
import { isAdmin, isAppRoot, isRole, isRoot, canAccessApp, hasFullAppAccess } from '@/core/auth/coreRoles';
import { checkHasScope, getCanScope, getLevelScope } from '@/core/auth/coreScopes';
import type { CoreApi, ToastApi } from '@/core/context/types';
import { settingManager } from '@/core/settings/SettingManager';
import type { WindowApi } from '@/core/windowManager/types';

import { schooltaskEmailLogout } from './authApi';

const noopWindowApi: WindowApi = {
	close: async () => true,
	minimize: () => undefined,
	maximize: () => undefined,
	restore: () => undefined,
	refresh: () => undefined,
	setTitle: (title: string) => {
		document.title = title ? `${title} — Школа` : 'Школа';
	},
	setSize: () => undefined,
	setPosition: () => undefined,
	setDragOptions: () => undefined,
	setResizable: () => undefined,
	setPositionFixed: () => undefined,
	setAutoSize: () => undefined,
	fitToContent: () => undefined,
	on: () => () => undefined,
	off: () => undefined,
	createChildWindow: () => ({ id: 'noop', close: () => undefined }),
};

const toast: ToastApi = {
	show: (payload) => {
		notifications.show({
			title: payload.title,
			message: payload.message,
			color: payload.color,
		});
	},
	success: (message) => notifications.show({ message, color: 'green' }),
	error: (message) => notifications.show({ message, color: 'red' }),
	info: (message) => notifications.show({ message, color: 'blue' }),
	warning: (message) => notifications.show({ message, color: 'yellow' }),
};

export function createSchooltaskStandaloneCoreApi(appId: string): CoreApi {
	const http = getApiClient();
	return {
		windowId: 'schooltask-standalone',
		appId,
		http: {
			get: http.get.bind(http),
			post: http.post.bind(http),
			put: http.put.bind(http),
			patch: http.patch.bind(http),
			delete: http.delete.bind(http),
		},
		toast,
		auth: {
			getUser: () => useAuthStore.getState().user,
			logout: () => schooltaskEmailLogout(),
		},
		window: noopWindowApi,
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
