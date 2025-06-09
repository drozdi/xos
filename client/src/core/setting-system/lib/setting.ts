import { Config, ConfigObject } from '../../config-system/lib/Config';
import { storageLocal } from './storage-local';

export type SettingOptions = Record<string, any>;
export type SubSettings = Record<string, Setting>;

export class Setting {
	private config?: Config;
	private parent: Setting | null = null;
	_key?: string;
	_: SubSettings = {};

	constructor(
		config: Config | ConfigObject,
		options: SettingOptions = {},
		key: string = '',
	) {
		// Обработка вызова без new
		if (!this || !(this as any).sub) {
			return new Setting(config, options, key);
		}

		// Инициализация Config
		this.config = config instanceof Config ? config : new Config(config);

		// Обработка ключа
		this._key = this.config.resolveValue(key || '').toLowerCase();

		// Применение дефолтных настроек
		this.default(options || {});
	}

	key(name: string): string {
		return [this._key, name].join('.');
	}

	add(settings: SettingOptions): void {
		Object.keys(settings).forEach((name) => {
			this.set(name, settings[name]);
		});
	}

	default(settings: SettingOptions): void {
		Object.keys(settings).forEach((name) => {
			const fullKey = this.key(name);
			storageLocal.default(fullKey, settings[name]);

			const allKey = `${this._key}..all`;
			let allItems: string[] = storageLocal.get(allKey, []);

			if (!allItems.includes(name)) {
				allItems.push(name);
				storageLocal.set(allKey, allItems);
			}
		});
	}

	set(name: string, val: any): any {
		const fullKey = this.key(name);
		storageLocal.set(fullKey, val);

		const allKey = `${this._key}..all`;
		let allItems: string[] = storageLocal.get(allKey, []);

		if (!allItems.includes(name)) {
			allItems.push(name);
			storageLocal.set(allKey, allItems);
		}

		return val;
	}

	get(name: string, def?: any, type): any {
		const fullKey = this.key(name);
		let result: any = storageLocal.get(fullKey, null);

		// Обработка ссылок вида "@other_setting"
		if (typeof result === 'string' && result.startsWith('@')) {
			const refKey = result.substring(1);
			result = storageLocal.get(this.key(refKey), null);

			if (result === null) {
				result = this.config?.get(refKey, null);
			}
		}

		// Проверка родительских настроек
		if (result === null && this.parent) {
			result = this.parent.get(name, null, type);
		}

		// Использование значения из конфига по умолчанию
		if (result === null) {
			result = this.config?.get(name, def);
		}

		// Разрешение значения и преобразование типа
		result = this.config?.resolveValue(result);
		return type?.(result) ?? def;
	}

	all(): SettingOptions {
		const allKey = `${this._key}..all`;
		const allItems: string[] = storageLocal.get(allKey, []);

		const result: SettingOptions = {};
		allItems.forEach((name) => {
			result[name] = this.get(name);
		});

		return result;
	}

	has(name: string): boolean {
		return storageLocal.has(this.key(name));
	}

	remove(name?: string): void {
		const allKey = `${this._key}..all`;
		let allItems: string[] = storageLocal.get(allKey, []);

		if (name) {
			// Удаление конкретной настройки
			storageLocal.del(this.key(name));
			allItems = allItems.filter((item) => item !== name);
			storageLocal.set(allKey, allItems);
		} else {
			// Удаление всех настроек
			allItems.forEach((item) => {
				storageLocal.del(this.key(item));
			});
			storageLocal.del(allKey);

			// Рекурсивное удаление поднастроек
			Object.values(this._).forEach((subSetting) => {
				subSetting.remove();
			});
			this._ = {};
		}
	}

	sub(
		key: string,
		options: SettingOptions = {},
		config?: Config | ConfigObject,
	): Setting {
		const resolvedKey = String(
			this.config?.resolveValue(key || '') || '',
		).toLowerCase();

		if (!this._[resolvedKey]) {
			const subConfig = config ?? this.config;
			const subSetting = new Setting(
				subConfig as Config | ConfigObject,
				options,
				[this._key, key].join('.'),
			);

			subSetting.parent = this;
			this._[resolvedKey] = subSetting;
		}

		return this._[resolvedKey];
	}
}
