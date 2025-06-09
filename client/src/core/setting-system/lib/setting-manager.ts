import { Config } from '../../config-system/lib/Config';
import { Setting, SettingOptions } from './setting';

// Статический список ключей для сортировки
const sortHKey = ['USER', 'APP', 'WIN'];

type SettingOrConfig = Setting | Config;
type HKeysCollection = Record<string, SettingOrConfig>;

export class SettingManager {
	[key: string]: any; // Для динамических свойств
	constructor(HKEYS?: HKeysCollection | SettingManager) {
		// Обработка вызова без new
		if (!this || !(this as any).join) {
			return new SettingManager(HKEYS as HKeysCollection);
		}

		// Если передан экземпляр SettingManager, вернем его
		if (HKEYS instanceof SettingManager) {
			return HKEYS;
		}

		// Инициализация переданными настройками
		if (HKEYS) {
			for (const name in HKEYS) {
				this.join(HKEYS[name], name);
			}
		}
	}
	join(setting: SettingOrConfig, name?: string): void {
		const keyName = (name || (setting as Setting)._key || '').toUpperCase();
		if (keyName === 'HKEY_CONFIG' && setting instanceof Config) {
			Object.defineProperty(this, keyName, {
				value: setting,
				writable: true,
				enumerable: true,
			});
		} else if (setting instanceof Setting) {
			Object.defineProperty(this, keyName, {
				value: setting,
				writable: true,
				enumerable: true,
			});
		}
	}
	newSetting(name: string, options: SettingOptions = {}, keyName?: string): Setting {
		const upperName = name.toUpperCase();
		const setting = new Setting(this.HKEY_CONFIG, options, keyName || upperName);

		Object.defineProperty(this, upperName, {
			value: setting,
			writable: true,
			enumerable: true,
		});

		return setting;
	}
	get(key: string, def?: any): any {
		let val: any = undefined;

		// Создаем уникальный список источников
		const keys = [
			...sortHKey,
			...Object.keys(this).filter((k) => k !== 'constructor'),
		].filter(
			(value, index, self) =>
				self.indexOf(value) === index && value !== 'HKEY_CONFIG' && this[value],
		);

		// Добавляем HKEY_CONFIG в конец, если он есть
		keys.push('HKEY_CONFIG');

		// Ищем значение в порядке приоритета источников
		for (const name of keys) {
			if (val !== null) {
				// Останавливаемся при первом не-null значении
				val = this[name].get(key, null);
				if (val !== null) break;
			}
		}

		return val !== null ? val : def;
	}
}
