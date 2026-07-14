export type SettingCategory = 'USER' | 'APP' | 'WIN' | 'HKEY_CONFIG';

export interface ISettingAdapter {
	get: (category: SettingCategory, key: string) => Promise<unknown | undefined>;
	set: (category: SettingCategory, key: string, value: unknown) => Promise<void>;
	has: (category: SettingCategory, key: string) => Promise<boolean>;
	remove: (category: SettingCategory, key: string) => Promise<void>;
	getAll?: (category?: SettingCategory) => Promise<Record<string, unknown>>;
}
