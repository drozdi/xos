import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lazy } from 'react';

import { resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { resetScopes } from '@/core/auth/coreScopes';
import { resetPageLifecycleForTests } from '@/core/lifecycle/pageLifecycle';
import type { ISettingAdapter, SettingCategory } from '@/core/settings/adapters/ISettingAdapter';
import { settingManager } from '@/core/settings/SettingManager';
import { clearPersistTimers } from '@/core/windowManager/persistWindow';
import { useWmStore } from '@/core/windowManager/useWmStore';
import { AppRegistry } from '@/core/appManager/AppRegistry';
import type { AppManifest } from '@/core/appManager/types';
import { useAppManager } from '@/core/appManager/useAppManager';

import { useExplorerLaunchStore } from '../explorerLaunchStore';
import { openVfsPathWithApp } from '../openWithRegistry';
import { explorerOpenPickerConsumerId } from '../useExplorerSatelliteFile';

vi.mock('@mantine/notifications', () => ({
	notifications: { show: vi.fn() },
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
}

const StubApp = lazy(async () => ({ default: () => null }));

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

describe('openVfsPathWithApp', () => {
	beforeEach(() => {
		settingManager.init(new MemoryAdapter());
		clearPersistTimers();
		resetUserRoles();
		resetScopes();
		resetPageLifecycleForTests();
		setUserRoles(['ROLE_USER']);
		AppRegistry.clear();
		useWmStore.setState({
			windows: {},
			activeWindowId: null,
			nextZIndex: 100,
		});
		useAppManager.setState({
			registry: new Map(),
			running: [],
		});
		useExplorerLaunchStore.setState({ pending: null });
	});

	it('singleInstance media: uses default key, setOpenRequest, second open focuses same window', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer-audio-player', singleInstance: true }),
		]);

		await openVfsPathWithApp(
			'explorer-audio-player',
			'local://user/a.mp3',
			'a.mp3',
		);

		const running = useAppManager.getState().running;
		expect(running).toHaveLength(1);
		expect(running[0]).toMatchObject({
			appId: 'explorer-audio-player',
			instanceKey: 'default',
		});
		expect(useExplorerLaunchStore.getState().pending).toEqual({
			appId: 'explorer-audio-player',
			vfsPath: 'local://user/a.mp3',
		});

		const firstId = running[0]!.windowId;
		useWmStore.getState().minimizeWindow(firstId);
		useExplorerLaunchStore.getState().consumeOpenRequest('explorer-audio-player');

		await openVfsPathWithApp(
			'explorer-audio-player',
			'local://user/b.mp3',
			'b.mp3',
		);

		expect(useAppManager.getState().running).toHaveLength(1);
		expect(useAppManager.getState().running[0]!.windowId).toBe(firstId);
		expect(useWmStore.getState().windows[firstId]?.minimized).toBe(false);
		expect(useWmStore.getState().windows[firstId]?.title).toBe('b.mp3');
		expect(useExplorerLaunchStore.getState().pending).toEqual({
			appId: 'explorer-audio-player',
			vfsPath: 'local://user/b.mp3',
		});
	});

	it('singleInstance video: second path reuses window and reloads via launch store', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer-video-player', singleInstance: true }),
		]);

		await openVfsPathWithApp('explorer-video-player', 'local://user/1.mp4');
		await openVfsPathWithApp('explorer-video-player', 'local://user/2.mp4', '2.mp4');

		expect(useAppManager.getState().running).toHaveLength(1);
		expect(useAppManager.getState().running[0]!.instanceKey).toBe('default');
		expect(useExplorerLaunchStore.getState().pending?.vfsPath).toBe('local://user/2.mp4');
	});

	it('multi notepad: different paths → two windows with distinct documentPath (uuid keys)', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer-notepad', singleInstance: false }),
		]);

		await openVfsPathWithApp('explorer-notepad', 'local://user/a.txt', 'a.txt');
		await openVfsPathWithApp('explorer-notepad', 'local://user/b.txt', 'b.txt');

		const running = useAppManager.getState().running;
		expect(running).toHaveLength(2);
		expect(running[0]!.instanceKey).not.toBe(running[1]!.instanceKey);
		expect(running[0]!.instanceKey).not.toContain('local://');
		expect(running[1]!.instanceKey).not.toContain('local://');
		expect(useExplorerLaunchStore.getState().pending).toBeNull();

		const winA = useWmStore.getState().windows[running[0]!.windowId];
		const winB = useWmStore.getState().windows[running[1]!.windowId];
		expect(winA?.documentPath).toBe('local://user/a.txt');
		expect(winA?.props?.documentPath).toBe('local://user/a.txt');
		expect(winB?.documentPath).toBe('local://user/b.txt');
		expect(winB?.props?.documentPath).toBe('local://user/b.txt');
	});

	it('multi notepad: same path → second window (no focus-only)', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer-notepad', singleInstance: false }),
		]);

		await openVfsPathWithApp('explorer-notepad', 'local://user/a.txt', 'a.txt');
		const firstId = useAppManager.getState().running[0]!.windowId;
		useWmStore.getState().minimizeWindow(firstId);

		await openVfsPathWithApp('explorer-notepad', 'local://user/a.txt', 'a.txt');

		const running = useAppManager.getState().running;
		expect(running).toHaveLength(2);
		expect(running[0]!.instanceKey).not.toBe(running[1]!.instanceKey);
		expect(useExplorerLaunchStore.getState().pending).toBeNull();

		for (const entry of running) {
			const win = useWmStore.getState().windows[entry.windowId];
			expect(win?.documentPath).toBe('local://user/a.txt');
			expect(win?.props?.documentPath).toBe('local://user/a.txt');
		}
	});

	it('multi markdown/image: uuid + documentPath, no launch-store pending', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer-markdown-viewer', singleInstance: false }),
			createManifest({ id: 'explorer-image-viewer', singleInstance: false }),
		]);

		await openVfsPathWithApp('explorer-markdown-viewer', 'local://user/a.md', 'a.md');
		await openVfsPathWithApp('explorer-image-viewer', 'local://user/pic.png', 'pic.png');

		expect(useAppManager.getState().running).toHaveLength(2);
		expect(useExplorerLaunchStore.getState().pending).toBeNull();

		const md = useAppManager.getState().running.find((r) => r.appId === 'explorer-markdown-viewer')!;
		const img = useAppManager.getState().running.find((r) => r.appId === 'explorer-image-viewer')!;
		expect(useWmStore.getState().windows[md.windowId]?.documentPath).toBe('local://user/a.md');
		expect(useWmStore.getState().windows[img.windowId]?.documentPath).toBe('local://user/pic.png');
	});

	it('explorerOpenPickerConsumerId is window-scoped', () => {
		expect(explorerOpenPickerConsumerId('explorer-notepad', 'win-1')).toBe(
			'explorer-notepad:open:win-1',
		);
		expect(explorerOpenPickerConsumerId('explorer-notepad', 'win-2')).not.toBe(
			explorerOpenPickerConsumerId('explorer-notepad', 'win-1'),
		);
	});

	it('multi explorer Start-style launch without key uses uuid (not default)', async () => {
		useAppManager.getState().registerApps([
			createManifest({ id: 'explorer', singleInstance: false }),
		]);

		const id1 = await useAppManager.getState().launchApp('explorer');
		const id2 = await useAppManager.getState().launchApp('explorer');

		expect(id1).not.toBe(id2);
		const keys = useAppManager.getState().running.map((r) => r.instanceKey);
		expect(keys).toHaveLength(2);
		expect(keys[0]).not.toBe('default');
		expect(keys[1]).not.toBe('default');
		expect(keys[0]).not.toBe(keys[1]);
	});
});
