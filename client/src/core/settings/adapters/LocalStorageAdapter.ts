import type { ISettingAdapter, SettingCategory } from './ISettingAdapter';

export const SETTINGS_STORAGE_PREFIX = 'xos.settings';

function storageKey(category: SettingCategory, key: string): string {
	return `${SETTINGS_STORAGE_PREFIX}.${category}.${key}`;
}

export class LocalStorageAdapter implements ISettingAdapter {
	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
		const raw = localStorage.getItem(storageKey(category, key));
		if (raw === null) {return undefined;}
		try {
			return JSON.parse(raw) as unknown;
		} catch {
			return undefined;
		}
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		localStorage.setItem(storageKey(category, key), JSON.stringify(value));
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		return localStorage.getItem(storageKey(category, key)) !== null;
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		localStorage.removeItem(storageKey(category, key));
	}

	/** Удаляет все ключи `xos.settings.*` (cache clear перед seed с сервера). */
	clearAll(): void {
		const prefix = `${SETTINGS_STORAGE_PREFIX}.`;
		const toRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const itemKey = localStorage.key(i);
			if (itemKey?.startsWith(prefix)) {
				toRemove.push(itemKey);
			}
		}
		for (const itemKey of toRemove) {
			localStorage.removeItem(itemKey);
		}
	}

	async getAll(category?: SettingCategory): Promise<Record<string, unknown>> {
		const result: Record<string, unknown> = {};
		const prefix = category
			? `${SETTINGS_STORAGE_PREFIX}.${category}.`
			: `${SETTINGS_STORAGE_PREFIX}.`;

		for (let i = 0; i < localStorage.length; i++) {
			const itemKey = localStorage.key(i);
			if (!itemKey?.startsWith(prefix)) {continue;}

			const suffix = category
				? itemKey.slice(prefix.length)
				: itemKey.slice(SETTINGS_STORAGE_PREFIX.length + 1).split('.').slice(1).join('.');

			const raw = localStorage.getItem(itemKey);
			if (raw === null) {continue;}

			try {
				result[suffix] = JSON.parse(raw) as unknown;
			} catch {
				// skip invalid entries
			}
		}

		return result;
	}
}
