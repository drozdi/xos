import type { ISettingAdapter, SettingCategory } from './ISettingAdapter';
import {
	getDesktopStatePersister,
	isDesktopStateSyncEnabled,
	isManagedDesktopStateKey,
} from '../desktopStatePersister';

/** Debounce API-side writes (ADR-desktop-ux-sync). Local `set` — сразу. */
export const API_WRITE_DEBOUNCE_MS = 2500;

type PendingKey = `${SettingCategory}:${string}`;

interface PendingWrite {
	category: SettingCategory;
	key: string;
	value: unknown;
}

/** Optional batch upsert / cache write-through on API adapter (ApiAdapter). */
export interface BatchSettingAdapter extends ISettingAdapter {
	setMany?: (
		items: Array<{ category: SettingCategory; key: string; value: unknown }>,
	) => Promise<void>;
	/** Sync in-memory API cache without HTTP (e.g. after local set). */
	prime?: (category: SettingCategory, key: string, value: unknown) => void;
	/** Drop key from in-memory API cache without HTTP (e.g. after local remove). */
	forget?: (category: SettingCategory, key: string) => void;
}

export interface CompositeAdapterOptions {
	useApi?: boolean;
	/** После успешного hydrate: API перекрывает local. При fail/degraded — false (local-first). */
	serverFirst?: boolean;
	onApiError?: (error: unknown, operation: string) => void;
	/** Override for tests. Default {@link API_WRITE_DEBOUNCE_MS}. */
	apiWriteDebounceMs?: number;
}

export class CompositeAdapter implements ISettingAdapter {
	private readonly pending = new Map<PendingKey, PendingWrite>();
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private flushInFlight: Promise<void> | null = null;
	private readonly debounceMs: number;
	private disposed = false;
	private listenersAttached = false;

	private readonly onVisibilityChange = (): void => {
		if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
			void this.flushPendingWrites();
		}
	};

	private readonly onPageHide = (): void => {
		void this.flushPendingWrites();
	};

	constructor(
		private readonly local: ISettingAdapter,
		private readonly api: BatchSettingAdapter,
		private readonly options: CompositeAdapterOptions = {},
	) {
		this.debounceMs = options.apiWriteDebounceMs ?? API_WRITE_DEBOUNCE_MS;
		if (options.useApi) {
			this.attachFlushListeners();
		}
	}

	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
		if (this.options.useApi && this.options.serverFirst) {
			try {
				const apiValue = await this.api.get(category, key);
				if (apiValue !== undefined) {
					await this.local.set(category, key, apiValue);
					return apiValue;
				}
			} catch (error) {
				this.options.onApiError?.(error, `get:${category}:${key}`);
			}
			return this.local.get(category, key);
		}

		const localValue = await this.local.get(category, key);
		if (localValue !== undefined) {
			return localValue;
		}

		if (!this.options.useApi) {
			return undefined;
		}

		try {
			const apiValue = await this.api.get(category, key);
			if (apiValue !== undefined) {
				await this.local.set(category, key, apiValue);
			}
			return apiValue;
		} catch (error) {
			this.options.onApiError?.(error, `get:${category}:${key}`);
			return undefined;
		}
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		await this.local.set(category, key, value);

		if (!this.options.useApi || this.disposed) {
			return;
		}

		// Keep api in-memory cache in sync so serverFirst get() does not overwrite local with stale.
		this.api.prime?.(category, key, value);

		if (isDesktopStateSyncEnabled() && isManagedDesktopStateKey(category, key)) {
			getDesktopStatePersister().schedule();
			return;
		}

		this.pending.set(pendingKey(category, key), { category, key, value });
		this.scheduleDebouncedFlush();
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		if (await this.local.has(category, key)) {
			return true;
		}

		if (!this.options.useApi) {
			return false;
		}

		try {
			return await this.api.has(category, key);
		} catch (error) {
			this.options.onApiError?.(error, `has:${category}:${key}`);
			return false;
		}
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		await this.local.remove(category, key);
		this.pending.delete(pendingKey(category, key));

		if (!this.options.useApi) {
			return;
		}

		this.api.forget?.(category, key);

		if (isDesktopStateSyncEnabled() && isManagedDesktopStateKey(category, key)) {
			getDesktopStatePersister().schedule();
			return;
		}

		try {
			await this.api.remove(category, key);
		} catch (error) {
			this.options.onApiError?.(error, `remove:${category}:${key}`);
		}
	}

	async getAll(category?: SettingCategory): Promise<Record<string, unknown>> {
		const localAll = (await this.local.getAll?.(category)) ?? {};

		if (!this.options.useApi) {
			return localAll;
		}

		try {
			const apiAll = (await this.api.getAll?.(category)) ?? {};
			// server-first: api перекрывает local; иначе local-first (degraded / до hydrate)
			return this.options.serverFirst
				? { ...localAll, ...apiAll }
				: { ...apiAll, ...localAll };
		} catch (error) {
			this.options.onApiError?.(error, `getAll:${category ?? 'all'}`);
			return localAll;
		}
	}

	/** Best-effort flush pending API writes (timer, visibility, unload). */
	async flushPendingWrites(): Promise<void> {
		this.clearDebounceTimer();

		if (this.flushInFlight) {
			await this.flushInFlight;
		}

		if (this.pending.size === 0) {
			return;
		}

		const items = Array.from(this.pending.values());
		this.pending.clear();

		const run = this.writeBatch(items);
		this.flushInFlight = run;
		try {
			await run;
		} finally {
			if (this.flushInFlight === run) {
				this.flushInFlight = null;
			}
		}
	}

	hasPendingWrites(): boolean {
		return this.pending.size > 0;
	}

	/** Detach flush listeners; best-effort flush remaining pending. */
	dispose(): void {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.detachFlushListeners();
		void this.flushPendingWrites();
	}

	private scheduleDebouncedFlush(): void {
		this.clearDebounceTimer();
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			void this.flushPendingWrites();
		}, this.debounceMs);
	}

	private clearDebounceTimer(): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private async writeBatch(items: PendingWrite[]): Promise<void> {
		try {
			if (typeof this.api.setMany === 'function') {
				await this.api.setMany(items);
				return;
			}
			for (const item of items) {
				await this.api.set(item.category, item.key, item.value);
			}
		} catch (error) {
			for (const item of items) {
				const key = pendingKey(item.category, item.key);
				if (!this.pending.has(key)) {
					this.pending.set(key, item);
				}
			}
			this.options.onApiError?.(error, 'set:batch');
		}
	}

	private attachFlushListeners(): void {
		if (this.listenersAttached || typeof document === 'undefined') {
			return;
		}
		document.addEventListener('visibilitychange', this.onVisibilityChange);
		window.addEventListener('pagehide', this.onPageHide);
		window.addEventListener('beforeunload', this.onPageHide);
		this.listenersAttached = true;
	}

	private detachFlushListeners(): void {
		if (!this.listenersAttached || typeof document === 'undefined') {
			return;
		}
		document.removeEventListener('visibilitychange', this.onVisibilityChange);
		window.removeEventListener('pagehide', this.onPageHide);
		window.removeEventListener('beforeunload', this.onPageHide);
		this.listenersAttached = false;
	}
}

function pendingKey(category: SettingCategory, key: string): PendingKey {
	return `${category}:${key}`;
}
