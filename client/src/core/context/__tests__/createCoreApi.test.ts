import { beforeEach, describe, expect, it } from 'vitest';

import { createCoreApi } from '@/core/context/createCoreApi';
import { settingManager } from '@/core/settings/SettingManager';
import type { ISettingAdapter, SettingCategory } from '@/core/settings/adapters/ISettingAdapter';
import { destroyWindowApi, getOrCreateWindowApi } from '@/core/windowManager/WindowApi';

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

describe('createCoreApi', () => {
	const windowId = 'demo-calculator__default';
	const appId = 'demo-calculator';

	beforeEach(() => {
		const adapter = new MemoryAdapter();
		settingManager.init(adapter);
		destroyWindowApi(windowId);
	});

	it('returns http, window, settings and context ids', () => {
		getOrCreateWindowApi(windowId);
		const coreApi = createCoreApi(windowId, appId);

		expect(coreApi.windowId).toBe(windowId);
		expect(coreApi.appId).toBe(appId);
		expect(coreApi.http.get).toBeTypeOf('function');
		expect(coreApi.window).toBe(getOrCreateWindowApi(windowId));
		expect(coreApi.settings).toBe(settingManager);
		expect(coreApi.auth.getUser).toBeTypeOf('function');
		expect(coreApi.toast.success).toBeTypeOf('function');
	});
});
