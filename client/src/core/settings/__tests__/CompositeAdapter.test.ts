import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiAdapter } from '../adapters/ApiAdapter';
import {
	API_WRITE_DEBOUNCE_MS,
	CompositeAdapter,
} from '../adapters/CompositeAdapter';
import type { BatchSettingAdapter, ISettingAdapter, SettingCategory } from '../adapters';

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

	async getAll(category?: SettingCategory): Promise<Record<string, unknown>> {
		const result: Record<string, unknown> = {};
		for (const [storeKey, value] of this.store.entries()) {
			const [cat, settingKey] = storeKey.split(':') as [SettingCategory, string];
			if (category && cat !== category) {
				continue;
			}
			result[settingKey] = value;
		}
		return result;
	}
}

function createBatchApi(base: MemoryAdapter): BatchSettingAdapter & {
	setMany: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
} {
	const set = vi.fn(async (category: SettingCategory, key: string, value: unknown) => {
		await base.set(category, key, value);
	});
	const setMany = vi.fn(
		async (items: Array<{ category: SettingCategory; key: string; value: unknown }>) => {
			for (const item of items) {
				await base.set(item.category, item.key, item.value);
			}
		},
	);

	return {
		get: (category, key) => base.get(category, key),
		set,
		setMany,
		has: (category, key) => base.has(category, key),
		remove: (category, key) => base.remove(category, key),
		getAll: (category) => base.getAll(category),
	};
}

/** Minimal document/window stubs so flush listeners attach under vitest `environment: node`. */
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

describe('CompositeAdapter', () => {
	let local: MemoryAdapter;
	let apiStore: MemoryAdapter;
	let onApiError: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		local = new MemoryAdapter();
		apiStore = new MemoryAdapter();
		onApiError = vi.fn();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('keeps local value when api set fails', async () => {
		vi.useFakeTimers();
		const failingApi: BatchSettingAdapter = {
			get: (category, key) => apiStore.get(category, key),
			set: async () => {
				throw new Error('network error');
			},
			setMany: async () => {
				throw new Error('network error');
			},
			has: (category, key) => apiStore.has(category, key),
			remove: (category, key) => apiStore.remove(category, key),
		};

		const composite = new CompositeAdapter(local, failingApi, {
			useApi: true,
			onApiError,
		});

		await composite.set('USER', 'theme', 'dark');

		await expect(local.get('USER', 'theme')).resolves.toBe('dark');
		await expect(composite.get('USER', 'theme')).resolves.toBe('dark');
		expect(onApiError).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(API_WRITE_DEBOUNCE_MS);
		expect(onApiError).toHaveBeenCalledOnce();
		composite.dispose();
	});

	it('falls back to api on local miss (local-first)', async () => {
		await apiStore.set('APP', 'recent', ['demo']);

		const composite = new CompositeAdapter(local, apiStore, { useApi: true, onApiError });
		await expect(composite.get('APP', 'recent')).resolves.toEqual(['demo']);
		await expect(local.get('APP', 'recent')).resolves.toEqual(['demo']);
		composite.dispose();
	});

	it('serverFirst get prefers api over stale local', async () => {
		await local.set('USER', 'theme', 'stale-local');
		await apiStore.set('USER', 'theme', 'from-server');

		const composite = new CompositeAdapter(local, apiStore, {
			useApi: true,
			serverFirst: true,
			onApiError,
		});

		await expect(composite.get('USER', 'theme')).resolves.toBe('from-server');
		await expect(local.get('USER', 'theme')).resolves.toBe('from-server');
		composite.dispose();
	});

	it('serverFirst getAll merges with api overwriting local', async () => {
		await local.set('USER', 'theme', 'stale');
		await local.set('USER', 'orphan', 'guest-only');
		await apiStore.set('USER', 'theme', 'server');
		await apiStore.set('USER', 'pinned', ['a']);

		const composite = new CompositeAdapter(local, apiStore, {
			useApi: true,
			serverFirst: true,
			onApiError,
		});

		await expect(composite.getAll('USER')).resolves.toEqual({
			theme: 'server',
			orphan: 'guest-only',
			pinned: ['a'],
		});
		composite.dispose();
	});

	it('local-first getAll keeps local over api on conflict', async () => {
		await local.set('USER', 'theme', 'local');
		await apiStore.set('USER', 'theme', 'server');

		const composite = new CompositeAdapter(local, apiStore, {
			useApi: true,
			serverFirst: false,
			onApiError,
		});

		await expect(composite.getAll('USER')).resolves.toEqual({ theme: 'local' });
		composite.dispose();
	});

	it('serverFirst falls back to local when api get fails', async () => {
		await local.set('USER', 'theme', 'local-buffer');

		const failingApi: ISettingAdapter = {
			get: async () => {
				throw new Error('offline');
			},
			set: (category, key, value) => apiStore.set(category, key, value),
			has: (category, key) => apiStore.has(category, key),
			remove: (category, key) => apiStore.remove(category, key),
			getAll: () => apiStore.getAll(),
		};

		const composite = new CompositeAdapter(local, failingApi, {
			useApi: true,
			serverFirst: true,
			onApiError,
		});

		await expect(composite.get('USER', 'theme')).resolves.toBe('local-buffer');
		expect(onApiError).toHaveBeenCalledOnce();
		composite.dispose();
	});

	it('serverFirst set empty launchHistory keeps api cache in sync (no stale overwrite)', async () => {
		const api = new ApiAdapter();
		api.preload([
			{
				category: 'APP',
				key: 'launchHistory',
				value: [{ appId: 'stale-app' }],
			},
		]);
		await local.set('APP', 'launchHistory', [{ appId: 'stale-app' }]);

		const composite = new CompositeAdapter(local, api, {
			useApi: true,
			serverFirst: true,
			onApiError,
		});

		await composite.set('APP', 'launchHistory', []);

		await expect(composite.get('APP', 'launchHistory')).resolves.toEqual([]);
		await expect(local.get('APP', 'launchHistory')).resolves.toEqual([]);
		await expect(api.get('APP', 'launchHistory')).resolves.toEqual([]);

		composite.dispose();
	});

	describe('debounce / batch API writes', () => {
		it('writes local immediately and coalesces N sets into one setMany after debounce', async () => {
			vi.useFakeTimers();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('WIN', 'app/1', { x: 1 });
			await composite.set('WIN', 'app/1', { x: 2 });
			await composite.set('WIN', 'app/1', { x: 3 });
			await composite.set('USER', 'theme', 'dark');

			await expect(local.get('WIN', 'app/1')).resolves.toEqual({ x: 3 });
			await expect(local.get('USER', 'theme')).resolves.toBe('dark');
			expect(api.setMany).not.toHaveBeenCalled();
			expect(api.set).not.toHaveBeenCalled();
			await expect(apiStore.get('WIN', 'app/1')).resolves.toBeUndefined();

			await vi.advanceTimersByTimeAsync(API_WRITE_DEBOUNCE_MS - 1);
			expect(api.setMany).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);
			expect(api.setMany).toHaveBeenCalledOnce();
			expect(api.setMany.mock.calls[0]![0]).toEqual([
				{ category: 'WIN', key: 'app/1', value: { x: 3 } },
				{ category: 'USER', key: 'theme', value: 'dark' },
			]);
			await expect(apiStore.get('WIN', 'app/1')).resolves.toEqual({ x: 3 });
			await expect(apiStore.get('USER', 'theme')).resolves.toBe('dark');

			composite.dispose();
		});

		it('does not debounce when useApi is false', async () => {
			vi.useFakeTimers();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: false,
				onApiError,
			});

			await composite.set('USER', 'theme', 'dark');
			await vi.advanceTimersByTimeAsync(API_WRITE_DEBOUNCE_MS);
			expect(api.setMany).not.toHaveBeenCalled();
			expect(api.set).not.toHaveBeenCalled();
			await expect(local.get('USER', 'theme')).resolves.toBe('dark');
		});

		it('flushes pending on visibilitychange → hidden', async () => {
			vi.useFakeTimers();
			const dom = installDomStubs();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('USER', 'theme', 'light');
			expect(api.setMany).not.toHaveBeenCalled();

			dom.visibilityState = 'hidden';
			dom.dispatchEvent({ type: 'visibilitychange' });

			await vi.advanceTimersByTimeAsync(0);
			expect(api.setMany).toHaveBeenCalledOnce();
			await expect(apiStore.get('USER', 'theme')).resolves.toBe('light');

			composite.dispose();
		});

		it('flushes pending on pagehide', async () => {
			vi.useFakeTimers();
			const dom = installDomStubs();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('APP', 'launchHistory', [{ appId: 'a' }]);
			dom.dispatchEvent({ type: 'pagehide' });

			await vi.advanceTimersByTimeAsync(0);
			expect(api.setMany).toHaveBeenCalledOnce();
			composite.dispose();
		});

		it('flushes pending on beforeunload', async () => {
			vi.useFakeTimers();
			const dom = installDomStubs();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('USER', 'pinned', ['x']);
			dom.dispatchEvent({ type: 'beforeunload' });

			await vi.advanceTimersByTimeAsync(0);
			expect(api.setMany).toHaveBeenCalledOnce();
			composite.dispose();
		});

		it('flushPendingWrites sends coalesced batch immediately', async () => {
			vi.useFakeTimers();
			const api = createBatchApi(apiStore);
			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('WIN', 'a/1', { w: 1 });
			await composite.set('WIN', 'a/2', { w: 2 });
			expect(composite.hasPendingWrites()).toBe(true);

			await composite.flushPendingWrites();
			expect(api.setMany).toHaveBeenCalledOnce();
			expect(composite.hasPendingWrites()).toBe(false);

			await vi.advanceTimersByTimeAsync(API_WRITE_DEBOUNCE_MS);
			expect(api.setMany).toHaveBeenCalledOnce();
			composite.dispose();
		});

		it('falls back to sequential set when setMany is absent', async () => {
			vi.useFakeTimers();
			const set = vi.fn(async (category: SettingCategory, key: string, value: unknown) => {
				await apiStore.set(category, key, value);
			});
			const api: ISettingAdapter = {
				get: (category, key) => apiStore.get(category, key),
				set,
				has: (category, key) => apiStore.has(category, key),
				remove: (category, key) => apiStore.remove(category, key),
			};

			const composite = new CompositeAdapter(local, api, {
				useApi: true,
				onApiError,
			});

			await composite.set('USER', 'a', 1);
			await composite.set('USER', 'b', 2);
			await vi.advanceTimersByTimeAsync(API_WRITE_DEBOUNCE_MS);

			expect(set).toHaveBeenCalledTimes(2);
			composite.dispose();
		});
	});
});
