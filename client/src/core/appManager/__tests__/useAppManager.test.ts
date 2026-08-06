import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lazy } from 'react';

import { resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { resetScopes } from '@/core/auth/coreScopes';
import {
	attachPageLifecycleListeners,
	resetPageLifecycleForTests,
} from '@/core/lifecycle/pageLifecycle';
import type { ISettingAdapter, SettingCategory } from '@/core/settings/adapters/ISettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';
import { clearPersistTimers } from '@/core/windowManager/persistWindow';
import { useWmStore } from '@/core/windowManager/useWmStore';

import { AppRegistry } from '../AppRegistry';
import {
	addToLaunchHistory,
	getLaunchHistory,
	removeFromLaunchHistory,
} from '../launchHistory';
import type { AppManifest } from '../types';
import { useAppManager } from '../useAppManager';

const notificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
	notifications: {
		show: (...args: unknown[]) => notificationsShow(...args),
	},
}));

class MemoryAdapter implements ISettingAdapter {
	private store = new Map<string, unknown>();

	private key(category: SettingCategory, settingKey: string): string {
		return `${category}:${settingKey}`;
	}

	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
		return this.store.get(this.key(category, key));
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		this.store.set(this.key(category, key), value);
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		return this.store.has(this.key(category, key));
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		this.store.delete(this.key(category, key));
	}

	reset(): void {
		this.store.clear();
	}
}

const StubApp = lazy(async () => ({
	default: () => null,
}));

function createManifest(overrides: Partial<AppManifest> = {}): AppManifest {
	return {
		id: 'test-app',
		name: 'Test App',
		version: '1.0.0',
		icon: 'icon',
		component: StubApp,
		defaultSize: { width: 640, height: 480 },
		...overrides,
	};
}

describe('useAppManager', () => {
	let adapter: MemoryAdapter;

	beforeEach(() => {
		adapter = new MemoryAdapter();
		settingManager.init(adapter);
		clearPersistTimers();
		resetUserRoles();
		resetScopes();
		resetPageLifecycleForTests();
		setUserRoles(['ROLE_USER']);
		AppRegistry.clear();
		notificationsShow.mockClear();

		useWmStore.setState({
			windows: {},
			activeWindowId: null,
			nextZIndex: 100,
		});

		useAppManager.setState({
			registry: new Map(),
			running: [],
		});
	});

	it('focuses existing window when singleInstance is true', async () => {
		const manifest = createManifest({ singleInstance: true });
		useAppManager.getState().registerApps([manifest]);

		const firstId = await useAppManager.getState().launchApp('test-app');
		useWmStore.getState().minimizeWindow(firstId!);

		const secondId = await useAppManager.getState().launchApp('test-app');

		expect(secondId).toBe(firstId);
		expect(useWmStore.getState().windows[firstId!]?.minimized).toBe(false);
		expect(useAppManager.getState().running).toHaveLength(1);
	});

	it('blocks launch when required role is missing', async () => {
		const manifest = createManifest({ requiredRole: 'main' });
		useAppManager.getState().registerApps([manifest]);
		setUserRoles(['ROLE_USER']);

		const windowId = await useAppManager.getState().launchApp('test-app');

		expect(windowId).toBeNull();
		expect(Object.keys(useWmStore.getState().windows)).toHaveLength(0);
		expect(notificationsShow).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Access denied' }),
		);
	});

	it('allows launch with app admin role', async () => {
		const manifest = createManifest({ requiredRole: 'main' });
		useAppManager.getState().registerApps([manifest]);
		setUserRoles(['ROLE_USER', 'ROLE_MAIN_ADMIN']);

		const windowId = await useAppManager.getState().launchApp('test-app');

		expect(windowId).not.toBeNull();
	});

	it('adds and removes launch history entries', async () => {
		await addToLaunchHistory('demo-calculator', 'default');
		await addToLaunchHistory('other-app', 'instance-1');

		let history = await getLaunchHistory();
		expect(history).toHaveLength(2);

		await removeFromLaunchHistory('other-app', 'instance-1');
		history = await getLaunchHistory();
		expect(history).toEqual([
			expect.objectContaining({ appId: 'demo-calculator', instanceKey: 'default' }),
		]);
	});

	it('does not duplicate history when skipHistory is true', async () => {
		const manifest = createManifest({ id: 'history-app' });
		useAppManager.getState().registerApps([manifest]);

		await useAppManager.getState().launchApp('history-app');
		await useAppManager.getState().launchApp('history-app', { skipHistory: true });

		const history = await getLaunchHistory();
		expect(history.filter((entry) => entry.appId === 'history-app')).toHaveLength(1);
	});

	it('removes running entry and launch history when window is closed', async () => {
		const manifest = createManifest();
		useAppManager.getState().registerApps([manifest]);

		const windowId = await useAppManager.getState().launchApp('test-app');
		expect(useAppManager.getState().running).toHaveLength(1);
		await expect(getLaunchHistory()).resolves.toEqual([
			expect.objectContaining({ appId: 'test-app', instanceKey: 'default' }),
		]);

		useWmStore.getState().closeWindow(windowId!);
		expect(useAppManager.getState().running).toHaveLength(0);

		await vi.waitFor(async () => {
			await expect(getLaunchHistory()).resolves.toEqual([]);
		});
	});

	it('keeps launchHistory when windows close during page unload', async () => {
		const handlers = new Map<string, Set<() => void>>();
		vi.stubGlobal('window', {
			addEventListener(type: string, fn: () => void) {
				if (!handlers.has(type)) {
					handlers.set(type, new Set());
				}
				handlers.get(type)!.add(fn);
			},
			removeEventListener(type: string, fn: () => void) {
				handlers.get(type)?.delete(fn);
			},
		});
		attachPageLifecycleListeners();

		const manifest = createManifest({ id: 'keep-app', name: 'Keep App' });
		useAppManager.getState().registerApps([manifest]);
		const windowId = await useAppManager.getState().launchApp('keep-app');
		await expect(getLaunchHistory()).resolves.toEqual([
			expect.objectContaining({ appId: 'keep-app', instanceKey: 'default' }),
		]);

		handlers.get('pagehide')?.forEach((fn) => fn());
		useWmStore.getState().closeWindow(windowId!);

		await expect(getLaunchHistory()).resolves.toHaveLength(1);
		vi.unstubAllGlobals();
		resetPageLifecycleForTests();
	});

	it('restoreFromHistory reopens apps from APP.launchHistory with WIN geometry path', async () => {
		const manifest = createManifest({ id: 'restore-app', name: 'Restore App' });
		useAppManager.getState().registerApps([manifest]);

		await addToLaunchHistory('restore-app', 'default');
		const winKey = 'restore-app/restore-app__default';
		await adapter.set('WIN', winKey, {
			position: { x: 40, y: 50, width: 320, height: 240 },
			state: { minimized: false, maximized: false },
			wmGroup: 'default',
			wmSort: 0,
			title: 'Restore App',
		});

		await useAppManager.getState().restoreFromHistory();

		const windowId = 'restore-app__default';
		const win = useWmStore.getState().windows[windowId];
		expect(win).toBeDefined();
		expect(win?.x).toBe(40);
		expect(win?.y).toBe(50);
		expect(win?.width).toBe(320);
		expect(win?.height).toBe(240);
		expect(useAppManager.getState().running).toEqual([
			{ windowId, appId: 'restore-app', instanceKey: 'default' },
		]);
		// skipHistory: history length unchanged (no duplicate)
		await expect(getLaunchHistory()).resolves.toHaveLength(1);
	});
});
