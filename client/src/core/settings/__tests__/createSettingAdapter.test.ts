import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@mantine/notifications', () => ({
	notifications: {
		show: vi.fn(),
	},
}));

vi.mock('../adapters/ApiAdapter', () => {
	class MockApiAdapter {
		private cache = new Map<string, unknown>();

		preload(items: Array<{ category: string; key: string; value: unknown }>): void {
			for (const item of items) {
				this.cache.set(`${item.category}:${item.key}`, item.value);
			}
		}

		async get(category: string, key: string): Promise<unknown | undefined> {
			return this.cache.get(`${category}:${key}`);
		}

		async set(category: string, key: string, value: unknown): Promise<void> {
			this.cache.set(`${category}:${key}`, value);
		}

		async has(category: string, key: string): Promise<boolean> {
			return this.cache.has(`${category}:${key}`);
		}

		async remove(category: string, key: string): Promise<void> {
			this.cache.delete(`${category}:${key}`);
		}

		async getAll(category?: string): Promise<Record<string, unknown>> {
			const result: Record<string, unknown> = {};
			for (const [storeKey, value] of this.cache.entries()) {
				const [cat, settingKey] = storeKey.split(':') as [string, string];
				if (category && cat !== category) {
					continue;
				}
				result[settingKey] = value;
			}
			return result;
		}
	}

	return { ApiAdapter: MockApiAdapter };
});

import { notifications } from '@mantine/notifications';

import {
	createSettingAdapter,
	resetSettingAdapterState,
} from '../createSettingAdapter';
import { LocalStorageAdapter, SETTINGS_STORAGE_PREFIX } from '../adapters/LocalStorageAdapter';

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

describe('createSettingAdapter hydrate', () => {
	beforeEach(() => {
		const storage = createStorage();
		vi.stubGlobal('localStorage', storage);
		vi.stubGlobal('window', { localStorage: storage });
		resetSettingAdapterState();
		vi.stubEnv('VITE_USE_API_SETTINGS', 'true');
		vi.mocked(notifications.show).mockClear();
	});

	it('awaits clear-then-seed so get reflects server, not stale local', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.theme`,
			JSON.stringify('stale-local'),
		);
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.guestOnly`,
			JSON.stringify('orphan'),
		);

		const adapter = await createSettingAdapter({
			preloadedSnapshot: {
				settings: [
					{
						category: 'USER',
						key: 'theme',
						value: 'from-server',
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
					{
						category: 'USER',
						key: 'startMenu.pinnedApps',
						value: ['explorer'],
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
				],
				explorerLastPath: null,
			},
		});

		await expect(adapter.get('USER', 'theme')).resolves.toBe('from-server');
		await expect(adapter.get('USER', 'startMenu.pinnedApps')).resolves.toEqual(['explorer']);
		await expect(adapter.get('USER', 'guestOnly')).resolves.toBeUndefined();
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.guestOnly`)).toBeNull();
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.theme`)).toBe(
			JSON.stringify('from-server'),
		);
	});

	it('serverFirst getAll prefers api over conflicting local after hydrate', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.APP.launchHistory`,
			JSON.stringify([{ appId: 'old' }]),
		);

		const adapter = await createSettingAdapter({
			preloadedSnapshot: {
				settings: [
					{
						category: 'APP',
						key: 'launchHistory',
						value: [{ appId: 'server-app', instanceKey: '1', launchedAt: 1 }],
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
				],
				explorerLastPath: null,
			},
		});

		await expect(adapter.getAll?.('APP')).resolves.toEqual({
			launchHistory: [{ appId: 'server-app', instanceKey: '1', launchedAt: 1 }],
		});
	});

	it('does not clear localStorage when preloadFailed', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.theme`,
			JSON.stringify('local-buffer'),
		);

		const adapter = await createSettingAdapter({ preloadFailed: true });

		await expect(adapter.get('USER', 'theme')).resolves.toBe('local-buffer');
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.theme`)).toBe(
			JSON.stringify('local-buffer'),
		);
		expect(notifications.show).toHaveBeenCalledOnce();
	});

	it('hydrates shell prefs: theme, pinned, launchHistory, WIN from server', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.theme`,
			JSON.stringify('stale'),
		);
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.startMenu.pinnedApps`,
			JSON.stringify(['stale-app']),
		);
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.APP.launchHistory`,
			JSON.stringify([{ appId: 'stale', instanceKey: 'x', launchedAt: 0 }]),
		);

		const winValue = {
			position: { x: 10, y: 20, width: 400, height: 300 },
			state: { minimized: false, maximized: false },
			wmGroup: 'default',
			wmSort: 0,
			title: 'Explorer',
		};

		const adapter = await createSettingAdapter({
			preloadedSnapshot: {
				settings: [
					{
						category: 'USER',
						key: 'theme',
						value: 'light',
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
					{
						category: 'USER',
						key: 'startMenu.pinnedApps',
						value: ['explorer', 'calendar'],
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
					{
						category: 'APP',
						key: 'launchHistory',
						value: [{ appId: 'explorer', instanceKey: 'default', launchedAt: 99 }],
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
					{
						category: 'WIN',
						key: 'explorer/explorer__default',
						value: winValue,
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
				],
				explorerLastPath: { path: 'home://Docs', updatedAt: '2026-01-01T00:00:00+00:00' },
			},
		});

		await expect(adapter.get('USER', 'theme')).resolves.toBe('light');
		await expect(adapter.get('USER', 'startMenu.pinnedApps')).resolves.toEqual([
			'explorer',
			'calendar',
		]);
		await expect(adapter.get('APP', 'launchHistory')).resolves.toEqual([
			{ appId: 'explorer', instanceKey: 'default', launchedAt: 99 },
		]);
		await expect(adapter.get('WIN', 'explorer/explorer__default')).resolves.toEqual(winValue);
		expect(localStorage.getItem('xos.explorer.lastPath')).toBe(JSON.stringify({ path: 'home://Docs/' }));
	});

	it('empty successful preload still clears orphan local keys', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.theme`,
			JSON.stringify('guest'),
		);

		const adapter = await createSettingAdapter({
			preloadedSnapshot: {
				settings: [],
				explorerLastPath: null,
			},
		});

		await expect(adapter.get('USER', 'theme')).resolves.toBeUndefined();
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.theme`)).toBeNull();
	});
});

describe('createSettingAdapter guest / API off', () => {
	beforeEach(() => {
		const storage = createStorage();
		vi.stubGlobal('localStorage', storage);
		vi.stubGlobal('window', { localStorage: storage });
		resetSettingAdapterState();
		vi.stubEnv('VITE_USE_API_SETTINGS', 'false');
		vi.mocked(notifications.show).mockClear();
	});

	it('returns LocalStorageAdapter only when VITE_USE_API_SETTINGS is not true', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.theme`,
			JSON.stringify('local-guest'),
		);

		const adapter = await createSettingAdapter({
			preloadedSnapshot: {
				settings: [
					{
						category: 'USER',
						key: 'theme',
						value: 'from-server',
						updatedAt: '2026-01-01T00:00:00+00:00',
					},
				],
				explorerLastPath: null,
			},
		});

		expect(adapter).toBeInstanceOf(LocalStorageAdapter);
		await expect(adapter.get('USER', 'theme')).resolves.toBe('local-guest');
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.theme`)).toBe(
			JSON.stringify('local-guest'),
		);
		expect(notifications.show).not.toHaveBeenCalled();
	});

	it('set/get stay local-only without clearing existing keys', async () => {
		localStorage.setItem(
			`${SETTINGS_STORAGE_PREFIX}.USER.startMenu.pinnedApps`,
			JSON.stringify(['explorer']),
		);

		const adapter = await createSettingAdapter({ preloadFailed: true });
		await adapter.set('USER', 'theme', 'dark');

		await expect(adapter.get('USER', 'theme')).resolves.toBe('dark');
		await expect(adapter.get('USER', 'startMenu.pinnedApps')).resolves.toEqual(['explorer']);
		expect(localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}.USER.theme`)).toBe(
			JSON.stringify('dark'),
		);
		expect(notifications.show).not.toHaveBeenCalled();
	});
});
