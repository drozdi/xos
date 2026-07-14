import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompositeAdapter } from '../adapters/CompositeAdapter';
import type { ISettingAdapter, SettingCategory } from '../adapters/ISettingAdapter';

class MemoryAdapter implements ISettingAdapter {
	constructor(private readonly store = new Map<string, unknown>()) {}

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

	failOnSet = false;
}

describe('CompositeAdapter', () => {
	let local: MemoryAdapter;
	let api: MemoryAdapter;
	let onApiError: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		local = new MemoryAdapter();
		api = new MemoryAdapter();
		onApiError = vi.fn();
	});

	it('keeps local value when api set fails', async () => {
		api.failOnSet = true;
		const failingApi: ISettingAdapter = {
			get: (category, key) => api.get(category, key),
			set: async () => {
				throw new Error('network error');
			},
			has: (category, key) => api.has(category, key),
			remove: (category, key) => api.remove(category, key),
		};

		const composite = new CompositeAdapter(local, failingApi, {
			useApi: true,
			onApiError,
		});

		await composite.set('USER', 'theme', 'dark');

		await expect(local.get('USER', 'theme')).resolves.toBe('dark');
		await expect(composite.get('USER', 'theme')).resolves.toBe('dark');
		expect(onApiError).toHaveBeenCalledOnce();
	});

	it('falls back to api on local miss', async () => {
		await api.set('APP', 'recent', ['demo']);

		const composite = new CompositeAdapter(local, api, { useApi: true, onApiError });
		await expect(composite.get('APP', 'recent')).resolves.toEqual(['demo']);
		await expect(local.get('APP', 'recent')).resolves.toEqual(['demo']);
	});
});
