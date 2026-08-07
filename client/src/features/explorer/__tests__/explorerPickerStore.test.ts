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
import { getLaunchHistory } from '@/core/appManager/launchHistory';
import type { AppManifest } from '@/core/appManager/types';
import { useAppManager } from '@/core/appManager/useAppManager';

import {
	EXPLORER_OPEN_PICKER_APP_ID,
	EXPLORER_SAVE_PICKER_APP_ID,
	matchesExplorerPickerFilter,
	openExplorerPicker,
	ownsActivePicker,
	useExplorerPickerStore,
} from '../explorerPickerStore';

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

function createPickerManifest(id: string, name: string): AppManifest {
	return {
		id,
		name,
		version: '1.0.0',
		icon: 'icon',
		component: StubApp,
		defaultSize: { width: 800, height: 600 },
		singleInstance: true,
		startMenu: false,
		startMenuList: false,
	};
}

describe('explorerPickerStore', () => {
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
		useExplorerPickerStore.setState({
			active: null,
			pendingResults: {},
		});
	});

	it('completePicker delivers path then closes picker window', () => {
		const windowId = 'explorer-open-picker__default';
		useWmStore.getState().openWindow({
			id: windowId,
			appId: EXPLORER_OPEN_PICKER_APP_ID,
			instanceKey: 'default',
			title: 'Open',
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		});

		useExplorerPickerStore.setState({
			active: {
				id: 'req-1',
				mode: 'open',
				consumerAppId: 'explorer-notepad',
				pickerWindowId: windowId,
			},
			pendingResults: {},
		});

		useExplorerPickerStore.getState().completePicker('local://user/a.txt');

		expect(useExplorerPickerStore.getState().active).toBeNull();
		expect(useExplorerPickerStore.getState().takeResult('explorer-notepad')).toBe(
			'local://user/a.txt',
		);
		expect(useWmStore.getState().windows[windowId]).toBeUndefined();
	});

	it('cancelPicker clears active and closes picker window without result', () => {
		const windowId = 'explorer-save-picker__default';
		useWmStore.getState().openWindow({
			id: windowId,
			appId: EXPLORER_SAVE_PICKER_APP_ID,
			instanceKey: 'default',
			title: 'Save',
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		});

		useExplorerPickerStore.setState({
			active: {
				id: 'req-2',
				mode: 'save',
				consumerAppId: 'explorer-markdown-viewer',
				pickerWindowId: windowId,
			},
			pendingResults: {},
		});

		useExplorerPickerStore.getState().cancelPicker();

		expect(useExplorerPickerStore.getState().active).toBeNull();
		expect(useExplorerPickerStore.getState().takeResult('explorer-markdown-viewer')).toBeNull();
		expect(useWmStore.getState().windows[windowId]).toBeUndefined();
	});

	it('cancelPicker with skipClose does not call closeWindow', () => {
		const windowId = 'explorer-open-picker__default';
		useWmStore.getState().openWindow({
			id: windowId,
			appId: EXPLORER_OPEN_PICKER_APP_ID,
			instanceKey: 'default',
			title: 'Open',
			x: 0,
			y: 0,
			width: 400,
			height: 300,
		});

		useExplorerPickerStore.setState({
			active: {
				id: 'req-3',
				mode: 'open',
				consumerAppId: 'explorer-notepad',
				pickerWindowId: windowId,
			},
		});

		useExplorerPickerStore.getState().cancelPicker({ skipClose: true });

		expect(useExplorerPickerStore.getState().active).toBeNull();
		expect(useWmStore.getState().windows[windowId]).toBeDefined();
	});

	it('openExplorerPicker launches open picker with skipHistory; history unchanged', async () => {
		useAppManager.getState().registerApps([
			createPickerManifest(EXPLORER_OPEN_PICKER_APP_ID, 'Open'),
			createPickerManifest(EXPLORER_SAVE_PICKER_APP_ID, 'Save'),
		]);

		const before = await getLaunchHistory();
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: 'explorer-notepad',
			title: 'Открыть файл',
		});

		const active = useExplorerPickerStore.getState().active;
		expect(active?.mode).toBe('open');
		expect(active?.consumerAppId).toBe('explorer-notepad');
		expect(active?.pickerWindowId).toBeTruthy();

		const windows = useWmStore.getState().windows;
		expect(Object.keys(windows)).toHaveLength(1);
		expect(windows[active!.pickerWindowId!]?.appId).toBe(EXPLORER_OPEN_PICKER_APP_ID);

		const after = await getLaunchHistory();
		expect(after).toEqual(before);
		expect(after.some((e) => e.appId === EXPLORER_OPEN_PICKER_APP_ID)).toBe(false);
	});

	it('openExplorerPicker save mode uses save-picker app and skipHistory', async () => {
		useAppManager.getState().registerApps([
			createPickerManifest(EXPLORER_OPEN_PICKER_APP_ID, 'Open'),
			createPickerManifest(EXPLORER_SAVE_PICKER_APP_ID, 'Save'),
		]);

		await openExplorerPicker({
			mode: 'save',
			consumerAppId: 'explorer-notepad',
		});

		const active = useExplorerPickerStore.getState().active;
		expect(active?.mode).toBe('save');
		expect(useWmStore.getState().windows[active!.pickerWindowId!]?.appId).toBe(
			EXPLORER_SAVE_PICKER_APP_ID,
		);
		await expect(getLaunchHistory()).resolves.toEqual([]);
	});

	it('openExplorerPicker replaces previous active picker (cancel + close, then new)', async () => {
		useAppManager.getState().registerApps([
			createPickerManifest(EXPLORER_OPEN_PICKER_APP_ID, 'Open'),
			createPickerManifest(EXPLORER_SAVE_PICKER_APP_ID, 'Save'),
		]);

		await openExplorerPicker({
			mode: 'open',
			consumerAppId: 'explorer-notepad',
		});
		const firstWindowId = useExplorerPickerStore.getState().active?.pickerWindowId;
		expect(firstWindowId).toBeTruthy();

		await openExplorerPicker({
			mode: 'save',
			consumerAppId: 'explorer-markdown-viewer',
		});

		const active = useExplorerPickerStore.getState().active;
		expect(active?.mode).toBe('save');
		expect(active?.consumerAppId).toBe('explorer-markdown-viewer');
		expect(useWmStore.getState().windows[active!.pickerWindowId!]?.appId).toBe(
			EXPLORER_SAVE_PICKER_APP_ID,
		);
		// Previous open-picker closed; no result delivered on replace/cancel
		expect(
			Object.keys(useWmStore.getState().windows).some((id) =>
				id.startsWith(EXPLORER_OPEN_PICKER_APP_ID),
			),
		).toBe(false);
		expect(useExplorerPickerStore.getState().takeResult('explorer-notepad')).toBeNull();
	});

	it('open→open singleInstance: stale cleanup must not cancel newer active (same windowId)', async () => {
		useAppManager.getState().registerApps([
			createPickerManifest(EXPLORER_OPEN_PICKER_APP_ID, 'Open'),
			createPickerManifest(EXPLORER_SAVE_PICKER_APP_ID, 'Save'),
		]);

		await openExplorerPicker({
			mode: 'open',
			consumerAppId: 'explorer-notepad',
		});
		const first = useExplorerPickerStore.getState().active;
		expect(first?.id).toBeTruthy();
		const windowId = first!.pickerWindowId!;
		expect(windowId).toBeTruthy();

		await openExplorerPicker({
			mode: 'open',
			consumerAppId: 'explorer-markdown-viewer',
		});
		const second = useExplorerPickerStore.getState().active;
		expect(second?.id).toBeTruthy();
		expect(second!.id).not.toBe(first!.id);
		expect(second!.pickerWindowId).toBe(windowId);

		// Stale unmount of the first shell: same windowId, old requestId
		expect(ownsActivePicker(second, { windowId, requestId: first!.id })).toBe(false);
		// Current shell owns the new request
		expect(ownsActivePicker(second, { windowId, requestId: second!.id })).toBe(true);

		// Simulating what ExplorerWorkspace cleanup must do: skip cancel when not owner
		if (
			second?.pickerWindowId === windowId &&
			ownsActivePicker(second, { windowId, requestId: first!.id })
		) {
			useExplorerPickerStore.getState().cancelPicker({ skipClose: true });
		}
		expect(useExplorerPickerStore.getState().active?.id).toBe(second!.id);
	});

	it('ownsActivePicker rejects mismatched requestId even when windowId matches', () => {
		const active = {
			id: 'req-new',
			mode: 'open' as const,
			consumerAppId: 'explorer-notepad',
			pickerWindowId: 'picker-win',
		};
		expect(ownsActivePicker(active, { windowId: 'picker-win', requestId: 'req-old' })).toBe(
			false,
		);
		expect(ownsActivePicker(active, { windowId: 'picker-win', requestId: 'req-new' })).toBe(
			true,
		);
		expect(ownsActivePicker(active, { windowId: 'other-win', requestId: 'req-new' })).toBe(
			false,
		);
		expect(ownsActivePicker(null, { windowId: 'picker-win', requestId: 'req-new' })).toBe(
			false,
		);
	});

	it('matchesExplorerPickerFilter keeps folders and filters by extension', () => {
		const picker = {
			id: '1',
			mode: 'open' as const,
			consumerAppId: 'x',
			extensions: ['txt'],
		};
		expect(matchesExplorerPickerFilter({ type: 'folder' }, picker)).toBe(true);
		expect(
			matchesExplorerPickerFilter({ type: 'file', extension: 'txt' }, picker),
		).toBe(true);
		expect(
			matchesExplorerPickerFilter({ type: 'file', extension: 'md' }, picker),
		).toBe(false);
	});
});
