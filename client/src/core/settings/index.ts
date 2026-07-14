export { Config } from './Config';
export { Setting } from './Setting';
export { settingManager, SettingManager } from './SettingManager';
export type { SettingCategory } from './SettingManager';
export { createSettingAdapter, useApiSettings } from './createSettingAdapter';
export { preloadSettings } from './preloadSettings';
export { useSetting, useSetState } from './hooks';
export type { ISettingAdapter } from './adapters/ISettingAdapter';
export {
	ApiAdapter,
	CompositeAdapter,
	LocalStorageAdapter,
} from './adapters';
