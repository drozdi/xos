type ConfigObject = Record<string, any>
type SettingOptions = Record<string, any>
type SubSettings = Record<string, any>

interface IIConfig {
	constructor(conf?: ConfigObject | IConfig): any
	key(key: string): string
	all(): ConfigObject
	default(conf: ConfigObject): void
	add(conf: ConfigObject): void
	set(key: string, val: any): any
	getRaw(key: string, def?: any): any
	get(key: string, def: any): any
	has(key: string): boolean
	remove(key: string): void
	resolveValue(value: any): any
	escapeValue(value: any): any
	unescapeValue(value: any): any
}
