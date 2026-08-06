import { notifications } from '@mantine/notifications';

import {
	type DesktopStateSnapshot,
	desktopStateApi,
} from '@/core/api/endpoints/desktopState';
import { useAuthStore } from '@/core/auth/authStore';
import { settingManager } from '@/core/settings/SettingManager';

import type { SettingCategory } from './adapters/ISettingAdapter';
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';

const USER_DESKTOP_STATE_KEYS = ['theme', 'startMenu.pinnedApps'] as const;
const LAUNCH_HISTORY_KEY = 'launchHistory';
const DESKTOP_STATE_SAVE_DEBOUNCE_MS = 2500;
const EXPLORER_LAST_PATH_STORAGE_KEY = 'xos.explorer.lastPath';
const MANAGED_SETTING_CATEGORIES: SettingCategory[] = ['USER', 'APP', 'WIN'];

let saveErrorToastShown = false;

function useApiSettings(): boolean {
	return import.meta.env.VITE_USE_API_SETTINGS === 'true';
}

export function isDesktopStateSyncEnabled(): boolean {
	return useApiSettings() && useAuthStore.getState().isAuthenticated;
}

/** All USER/APP/WIN keys go through desktop-state (no per-key /api/settings). */
export function isManagedDesktopStateKey(category: SettingCategory, _key: string): boolean {
	return MANAGED_SETTING_CATEGORIES.includes(category);
}

export function readExplorerLastPathSnapshot(): DesktopStateSnapshot['explorerLastPath'] {
	if (typeof localStorage === 'undefined') {
		return null;
	}
	try {
		const raw = localStorage.getItem(EXPLORER_LAST_PATH_STORAGE_KEY);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as unknown;
		if (
			!parsed ||
			typeof parsed !== 'object' ||
			typeof (parsed as { path?: unknown }).path !== 'string' ||
			!(parsed as { path: string }).path.trim()
		) {
			return null;
		}
		return { path: (parsed as { path: string }).path };
	} catch {
		return null;
	}
}

async function buildSnapshotFromLocal(): Promise<DesktopStateSnapshot> {
	const local = new LocalStorageAdapter();
	const settings: DesktopStateSnapshot['settings'] = [];

	for (const category of MANAGED_SETTING_CATEGORIES) {
		const bag = await local.getAll(category);
		for (const [key, value] of Object.entries(bag)) {
			settings.push({ category, key, value });
		}
	}

	return {
		settings,
		explorerLastPath: readExplorerLastPathSnapshot(),
	};
}

function showSaveErrorToast(): void {
	if (saveErrorToastShown) {
		return;
	}
	saveErrorToastShown = true;
	notifications.show({
		color: 'yellow',
		title: 'Настройки',
		message:
			'Не удалось синхронизировать состояние рабочего стола с сервером. Используется локальная копия.',
	});
}

export class DesktopStatePersister {
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private flushInFlight: Promise<void> | null = null;
	private scheduled = false;
	private listenersAttached = false;

	private readonly onVisibilityChange = (): void => {
		if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
			void this.flush();
		}
	};

	private readonly onPageHide = (): void => {
		void this.flush();
	};

	schedule(): void {
		if (!isDesktopStateSyncEnabled() || !settingManager.isInitialized()) {
			return;
		}
		this.attachListeners();
		this.scheduled = true;
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			void this.flush();
		}, DESKTOP_STATE_SAVE_DEBOUNCE_MS);
	}

	async flush(): Promise<void> {
		if (!isDesktopStateSyncEnabled() || !settingManager.isInitialized()) {
			return;
		}
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		if (this.flushInFlight) {
			await this.flushInFlight;
		}
		if (!this.scheduled) {
			return;
		}

		this.scheduled = false;
		const run = (async () => {
			try {
				await desktopStateApi.save(await buildSnapshotFromLocal());
				saveErrorToastShown = false;
			} catch (error) {
				this.scheduled = true;
				showSaveErrorToast();
				// eslint-disable-next-line no-console -- degraded sync is best-effort
				console.warn('[desktop-state] save failed:', error);
			}
		})();

		this.flushInFlight = run;
		try {
			await run;
		} finally {
			if (this.flushInFlight === run) {
				this.flushInFlight = null;
			}
		}
	}

	attachListeners(): void {
		if (this.listenersAttached || typeof document === 'undefined') {
			return;
		}
		document.addEventListener('visibilitychange', this.onVisibilityChange);
		window.addEventListener('pagehide', this.onPageHide);
		window.addEventListener('beforeunload', this.onPageHide);
		this.listenersAttached = true;
	}

	detachListeners(): void {
		if (!this.listenersAttached || typeof document === 'undefined') {
			return;
		}
		document.removeEventListener('visibilitychange', this.onVisibilityChange);
		window.removeEventListener('pagehide', this.onPageHide);
		window.removeEventListener('beforeunload', this.onPageHide);
		this.listenersAttached = false;
	}
}

let sharedPersister: DesktopStatePersister | null = null;

export function getDesktopStatePersister(): DesktopStatePersister {
	if (!sharedPersister) {
		sharedPersister = new DesktopStatePersister();
	}
	return sharedPersister;
}

export function resetDesktopStatePersister(): void {
	sharedPersister?.detachListeners();
	sharedPersister = null;
	saveErrorToastShown = false;
}

export {
	DESKTOP_STATE_SAVE_DEBOUNCE_MS,
	EXPLORER_LAST_PATH_STORAGE_KEY,
	LAUNCH_HISTORY_KEY,
	USER_DESKTOP_STATE_KEYS,
};
