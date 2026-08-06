import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mantine/notifications', () => ({
	notifications: {
		show: vi.fn(),
	},
}));

const saveDesktopState = vi.fn();

vi.mock('@/core/api/endpoints/desktopState', () => ({
	desktopStateApi: {
		save: (...args: unknown[]) => saveDesktopState(...args),
	},
}));

import { useAuthStore } from '@/core/auth/authStore';
import { settingManager } from '@/core/settings/SettingManager';
import { createSettingAdapter } from '@/core/settings/createSettingAdapter';
import {
	DESKTOP_STATE_SAVE_DEBOUNCE_MS,
	getDesktopStatePersister,
	resetDesktopStatePersister,
} from '@/core/settings/desktopStatePersister';

function createStorage(): Storage {
	const store = new Map<string, string>();

	return {
		get length() {
			return store.size;
		},
		clear: () => store.clear(),
		getItem: (key) => store.get(key) ?? null,
		key: (index) => [...store.keys()][index] ?? null,
		removeItem: (key) => {
			store.delete(key);
		},
		setItem: (key, value) => {
			store.set(key, value);
		},
	};
}

function installDomStubs(): {
	visibilityState: string;
	dispatchEvent: (event: { type: string }) => boolean;
} {
	const handlers = new Map<string, Set<() => void>>();
	const target = {
		visibilityState: 'visible',
		addEventListener(type: string, fn: () => void) {
			if (!handlers.has(type)) {
				handlers.set(type, new Set());
			}
			handlers.get(type)!.add(fn);
		},
		removeEventListener(type: string, fn: () => void) {
			handlers.get(type)?.delete(fn);
		},
		dispatchEvent(event: { type: string }) {
			handlers.get(event.type)?.forEach((fn) => fn());
			return true;
		},
	};
	vi.stubGlobal('document', target);
	vi.stubGlobal('window', target);
	return target;
}

describe('DesktopStatePersister', () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		saveDesktopState.mockReset();
		saveDesktopState.mockImplementation(async (snapshot) => snapshot);
		vi.stubEnv('VITE_USE_API_SETTINGS', 'true');
		vi.stubGlobal('localStorage', createStorage());
		installDomStubs();
		useAuthStore.setState({
			user: { id: 1, email: 'user@example.com', roles: [] },
			scopes: {},
			isAuthenticated: true,
			isLoading: false,
		});
		const adapter = await createSettingAdapter({
			preloadedSnapshot: { settings: [], explorerLastPath: null },
		});
		settingManager.init(adapter);
		resetDesktopStatePersister();
	});

	afterEach(() => {
		settingManager.reset();
		resetDesktopStatePersister();
		useAuthStore.setState({
			user: null,
			scopes: {},
			isAuthenticated: false,
			isLoading: false,
		});
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it('coalesces multiple managed local writes into one desktop-state save', async () => {
		await settingManager.set('USER', 'theme', 'dark');
		await settingManager.set('USER', 'date.locale', 'ru');
		await settingManager.set('WIN', 'explorer/explorer__default', { x: 1 });
		await settingManager.set('WIN', 'explorer/explorer__default', { x: 2 });
		localStorage.setItem('xos.explorer.lastPath', JSON.stringify({ path: 'home://Docs/' }));
		getDesktopStatePersister().schedule();

		expect(saveDesktopState).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(DESKTOP_STATE_SAVE_DEBOUNCE_MS);

		expect(saveDesktopState).toHaveBeenCalledTimes(1);
		const snapshot = saveDesktopState.mock.calls[0]![0] as {
			settings: Array<{ category: string; key: string; value: unknown }>;
			explorerLastPath: { path: string } | null;
		};
		expect(snapshot.explorerLastPath).toEqual({ path: 'home://Docs/' });
		expect(snapshot.settings).toEqual(
			expect.arrayContaining([
				{ category: 'USER', key: 'theme', value: 'dark' },
				{ category: 'USER', key: 'date.locale', value: 'ru' },
				{ category: 'WIN', key: 'explorer/explorer__default', value: { x: 2 } },
			]),
		);
	});

	it('flushes pending save immediately', async () => {
		await settingManager.set('USER', 'startMenu.pinnedApps', ['explorer']);
		await settingManager.set('USER', 'date.locale', 'en');
		await getDesktopStatePersister().flush();

		expect(saveDesktopState).toHaveBeenCalledTimes(1);
		const snapshot = saveDesktopState.mock.calls[0]![0] as {
			settings: Array<{ category: string; key: string; value: unknown }>;
		};
		expect(snapshot.settings).toEqual(
			expect.arrayContaining([
				{ category: 'USER', key: 'startMenu.pinnedApps', value: ['explorer'] },
				{ category: 'USER', key: 'date.locale', value: 'en' },
			]),
		);
	});

	it('does not call desktop-state API for guest or API-off mode', async () => {
		settingManager.reset();
		resetDesktopStatePersister();
		useAuthStore.setState({
			user: null,
			scopes: {},
			isAuthenticated: false,
			isLoading: false,
		});

		const adapter = await createSettingAdapter();
		settingManager.init(adapter);
		await settingManager.set('USER', 'theme', 'guest-dark');
		await vi.advanceTimersByTimeAsync(DESKTOP_STATE_SAVE_DEBOUNCE_MS);

		expect(saveDesktopState).not.toHaveBeenCalled();
	});
});
