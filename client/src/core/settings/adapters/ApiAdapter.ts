import {
	deleteSetting,
	getAllSettings,
	getSetting,
	upsertSetting,
} from '@/core/api/endpoints/settings';
import type { SettingCategory, UserSettingDto } from '@/types/api.types';

import type { ISettingAdapter } from './ISettingAdapter';

type CacheKey = `${SettingCategory}:${string}`;

function cacheKey(category: SettingCategory, key: string): CacheKey {
	return `${category}:${key}`;
}

export class ApiAdapter implements ISettingAdapter {
	private cache = new Map<CacheKey, unknown>();
	private loadedCategories = new Set<SettingCategory | 'ALL'>();

	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
		const ck = cacheKey(category, key);
		if (this.cache.has(ck)) {
			return this.cache.get(ck);
		}

		await this.ensureCategoryLoaded(category);

		if (this.cache.has(ck)) {
			return this.cache.get(ck);
		}

		const item = await getSetting(category, key);
		if (!item) {return undefined;}

		this.cache.set(ck, item.value);
		return item.value;
	}

	async set(category: SettingCategory, key: string, value: unknown): Promise<void> {
		await upsertSetting(category, key, value);
		this.cache.set(cacheKey(category, key), value);
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		const value = await this.get(category, key);
		return value !== undefined;
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		await deleteSetting(category, key);
		this.cache.delete(cacheKey(category, key));
	}

	async getAll(category?: SettingCategory): Promise<Record<string, unknown>> {
		await this.ensureCategoryLoaded(category ?? 'ALL');
		const result: Record<string, unknown> = {};

		for (const [key, value] of this.cache.entries()) {
			const [cat, settingKey] = key.split(':') as [SettingCategory, string];
			if (category && cat !== category) {continue;}
			result[settingKey] = value;
		}

		return result;
	}

	invalidate(category?: SettingCategory): void {
		if (!category) {
			this.cache.clear();
			this.loadedCategories.clear();
			return;
		}

		for (const key of this.cache.keys()) {
			if (key.startsWith(`${category}:`)) {
				this.cache.delete(key);
			}
		}
		this.loadedCategories.delete(category);
	}

	private async ensureCategoryLoaded(category: SettingCategory | 'ALL'): Promise<void> {
		if (this.loadedCategories.has(category) || this.loadedCategories.has('ALL')) {
			return;
		}

		const items = await getAllSettings(category === 'ALL' ? undefined : category);
		for (const item of items) {
			this.cache.set(cacheKey(item.category, item.key), item.value);
		}
		this.loadedCategories.add(category);
	}

	preload(items: UserSettingDto[]): void {
		for (const item of items) {
			this.cache.set(cacheKey(item.category, item.key), item.value);
			this.loadedCategories.add(item.category);
		}
		this.loadedCategories.add('ALL');
	}
}
