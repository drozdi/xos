import { getByPath, hasByPath, removeByPath, setByPath } from './pathUtils';

type AsyncSettingAccessor = {
	get: (key: string) => Promise<unknown>;
	set: (key: string, value: unknown) => Promise<void>;
	has: (key: string) => Promise<boolean>;
	remove: (key: string) => Promise<void>;
};

export class Setting {
	constructor(
		private readonly accessor: AsyncSettingAccessor,
		private readonly rootKey = '',
	) {}

	private resolveKey(path: string): string {
		if (!this.rootKey) {return path;}
		if (!path) {return this.rootKey;}
		return `${this.rootKey}.${path}`;
	}

	async get<T = unknown>(path: string, defaultValue?: T): Promise<T | undefined> {
		const fullKey = this.resolveKey(path);

		if (this.rootKey && path.includes('.')) {
			const rootValue = await this.accessor.get(this.rootKey);
			if (rootValue !== null && rootValue !== undefined && typeof rootValue === 'object') {
				const nested = getByPath(rootValue, path);
				if (nested !== undefined) {return nested as T;}
			}
		}

		const stored = await this.accessor.get(fullKey);
		if (stored !== undefined) {return stored as T;}
		return defaultValue;
	}

	async set(path: string, value: unknown): Promise<void> {
		const fullKey = this.resolveKey(path);

		if (this.rootKey && path.includes('.')) {
			const rootValue = await this.accessor.get(this.rootKey);
			const base =
				rootValue !== null && rootValue !== undefined && typeof rootValue === 'object' && !Array.isArray(rootValue)
					? { ...(rootValue as Record<string, unknown>) }
					: {};
			setByPath(base, path, value);
			await this.accessor.set(this.rootKey, base);
			return;
		}

		await this.accessor.set(fullKey, value);
	}

	async has(path: string): Promise<boolean> {
		const fullKey = this.resolveKey(path);
		if (await this.accessor.has(fullKey)) {return true;}

		if (this.rootKey && path.includes('.')) {
			const rootValue = await this.accessor.get(this.rootKey);
			return hasByPath(rootValue, path);
		}

		return false;
	}

	async remove(path: string): Promise<void> {
		const fullKey = this.resolveKey(path);

		if (this.rootKey && path.includes('.')) {
			const rootValue = await this.accessor.get(this.rootKey);
			if (rootValue !== null && rootValue !== undefined && typeof rootValue === 'object' && !Array.isArray(rootValue)) {
				const copy = { ...(rootValue as Record<string, unknown>) };
				if (removeByPath(copy, path)) {
					await this.accessor.set(this.rootKey, copy);
					return;
				}
			}
		}

		await this.accessor.remove(fullKey);
	}

	sub(prefix: string): Setting {
		return new Setting(this.accessor, this.resolveKey(prefix));
	}
}
