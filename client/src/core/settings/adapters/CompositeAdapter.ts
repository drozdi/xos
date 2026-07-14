import type { ISettingAdapter, SettingCategory } from './ISettingAdapter';

export interface CompositeAdapterOptions {
	useApi?: boolean;
	onApiError?: (error: unknown, operation: string) => void;
}

export class CompositeAdapter implements ISettingAdapter {
	constructor(
		private readonly local: ISettingAdapter,
		private readonly api: ISettingAdapter,
		private readonly options: CompositeAdapterOptions = {},
	) {}

	async get(category: SettingCategory, key: string): Promise<unknown | undefined> {
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

		if (!this.options.useApi) {return;}

		try {
			await this.api.set(category, key, value);
		} catch (error) {
			this.options.onApiError?.(error, `set:${category}:${key}`);
		}
	}

	async has(category: SettingCategory, key: string): Promise<boolean> {
		if (await this.local.has(category, key)) {return true;}

		if (!this.options.useApi) {return false;}

		try {
			return await this.api.has(category, key);
		} catch (error) {
			this.options.onApiError?.(error, `has:${category}:${key}`);
			return false;
		}
	}

	async remove(category: SettingCategory, key: string): Promise<void> {
		await this.local.remove(category, key);

		if (!this.options.useApi) {return;}

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
			return { ...apiAll, ...localAll };
		} catch (error) {
			this.options.onApiError?.(error, `getAll:${category ?? 'all'}`);
			return localAll;
		}
	}
}
