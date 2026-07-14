import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

import { getByPath, hasByPath } from './pathUtils';

export class Config {
	get<T = unknown>(key: string): T | undefined {
		return getByPath(HKEY_CONFIG_DEFAULTS, key) as T | undefined;
	}

	has(key: string): boolean {
		return hasByPath(HKEY_CONFIG_DEFAULTS, key);
	}

	getAll(): typeof HKEY_CONFIG_DEFAULTS {
		return HKEY_CONFIG_DEFAULTS;
	}
}
