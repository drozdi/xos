import { beforeEach, describe, expect, it } from 'vitest';

import type { ISettingAdapter, SettingCategory } from '../adapters/ISettingAdapter';
import { SettingManager } from '../SettingManager';

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

describe('SettingManager', () => {
	let adapter: MemoryAdapter;
	let manager: SettingManager;

	beforeEach(() => {
		adapter = new MemoryAdapter();
		manager = new SettingManager();
		manager.init(adapter);
	});

	it('resolves USER over WIN for the same key', async () => {
		await adapter.set('WIN', 'theme', 'dark');
		await adapter.set('USER', 'theme', 'light');

		await expect(manager.get('WIN', 'theme')).resolves.toBe('light');
	});

	it('falls back to HKEY_CONFIG defaults when adapter has no value', async () => {
		await expect(manager.get('USER', 'taskbar.height')).resolves.toBe(48);
	});

	it('writes to the requested category only', async () => {
		await manager.set('USER', 'layout.view', 'custom');

		await expect(adapter.get('USER', 'layout.view')).resolves.toBe('custom');
		await expect(adapter.get('WIN', 'layout.view')).resolves.toBeUndefined();
	});
});
