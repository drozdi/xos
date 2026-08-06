import { Config } from './Config';
import { Setting } from './Setting';
import type { ISettingAdapter, SettingCategory } from './adapters/ISettingAdapter';

const READ_PRIORITY: SettingCategory[] = ['USER', 'APP', 'WIN', 'HKEY_CONFIG'];

type ChangeListener = (category: SettingCategory, key: string) => void;

function joinKey(prefix: string, path: string): string {
	if (!prefix) {return path;}
	if (!path) {return prefix;}
	return `${prefix}.${path}`;
}

class SettingManagerImpl {
	private adapter: ISettingAdapter | null = null;
	private readonly config = new Config();
	private readonly listeners = new Set<ChangeListener>();
	private readonly initListeners = new Set<() => void>();

	init(adapter: ISettingAdapter): void {
		this.disposeAdapter(this.adapter);
		this.adapter = adapter;
		this.emitInit();
	}

	reset(): void {
		this.disposeAdapter(this.adapter);
		this.adapter = null;
		this.emitInit();
	}

	private disposeAdapter(adapter: ISettingAdapter | null): void {
		if (!adapter || typeof (adapter as { dispose?: unknown }).dispose !== 'function') {
			return;
		}
		(adapter as { dispose: () => void }).dispose();
	}

	isInitialized(): boolean {
		return this.adapter !== null;
	}

	subscribe(listener: ChangeListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/** Вызывается при init() и reset(). */
	subscribeInit(listener: () => void): () => void {
		this.initListeners.add(listener);
		return () => {
			this.initListeners.delete(listener);
		};
	}

	private emit(category: SettingCategory, key: string): void {
		for (const listener of this.listeners) {
			listener(category, key);
		}
	}

	private emitInit(): void {
		for (const listener of this.initListeners) {
			listener();
		}
	}

	private assertAdapter(): ISettingAdapter {
		if (!this.adapter) {
			throw new Error('SettingManager not initialized. Call init() at app startup.');
		}
		return this.adapter;
	}

	async get(_category: SettingCategory, key: string): Promise<unknown> {
		for (const cat of READ_PRIORITY) {
			if (cat === 'HKEY_CONFIG') {
				const defaultValue = this.config.get(key);
				if (defaultValue !== undefined) {return defaultValue;}
				continue;
			}

			const value = await this.assertAdapter().get(cat, key);
			if (value !== undefined) {return value;}
		}

		return undefined;
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		await this.assertAdapter().set(category, key, value);
		this.emit(category, key);
	}

	/** Flush debounced API writes (CompositeAdapter). No-op for local-only adapters. */
	async flush(): Promise<void> {
		const adapter = this.adapter as { flushPendingWrites?: () => Promise<void> } | null;
		if (adapter && typeof adapter.flushPendingWrites === 'function') {
			await adapter.flushPendingWrites();
		}
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		if (category === 'HKEY_CONFIG') {
			return this.config.has(key);
		}
		return this.assertAdapter().has(category, key);
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		if (category === 'HKEY_CONFIG') {
			return;
		}
		await this.assertAdapter().remove(category, key);
		this.emit(category, key);
	}

	async getAll(category?: SettingCategory): Promise<Record<string, unknown>> {
		const adapter = this.assertAdapter();
		return (await adapter.getAll?.(category)) ?? {};
	}

	sub(category: SettingCategory, prefix: string): Setting {
		return new Setting(
			{
				get: (path) => this.get(category, joinKey(prefix, path)),
				set: (path, value) => this.set(category, joinKey(prefix, path), value),
				has: (path) => this.has(category, joinKey(prefix, path)),
				remove: (path) => this.remove(category, joinKey(prefix, path)),
			},
			'',
		);
	}
}

export const settingManager = new SettingManagerImpl();
export { SettingManagerImpl as SettingManager };
export type { SettingCategory };
