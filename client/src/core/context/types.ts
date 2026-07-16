import type { AxiosInstance } from 'axios';

import type { SettingManager } from '@/core/settings/SettingManager';
import type { WindowApi } from '@/core/windowManager/types';
import type { UserSummary } from '@/types/api.types';

export interface ToastApi {
	show: (payload: { title?: string; message: string; color?: string }) => void;
	success: (message: string) => void;
	error: (message: string) => void;
	info: (message: string) => void;
	warning: (message: string) => void;
}

export interface CoreApi {
	windowId: string;
	appId: string;
	http: Pick<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'>;
	toast: ToastApi;
	auth: {
		getUser: () => UserSummary | null;
		logout: () => Promise<void>;
	};
	window: WindowApi;
	roles: {
		isRole: (role: string) => boolean;
		isRoot: () => boolean;
		isAdmin: (mod?: string) => boolean;
		isAppRoot: (mod: string) => boolean;
		canAccessApp: (rolePrefix: string) => boolean;
		hasFullAppAccess: (rolePrefix: string) => boolean;
	};
	scopes: {
		checkHasScope: (scope: string, rolePrefix?: string) => boolean;
		getLevelScope: (scope: string) => number;
		getCanScope: (scope: string) => number;
	};
	settings: SettingManager;
}

/** @deprecated Use CoreApi */
export type CoreApiStub = CoreApi;
