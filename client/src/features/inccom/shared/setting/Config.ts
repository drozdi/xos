export class Config {
	private conf: ConfigObject = {}

	constructor(conf?: ConfigObject | Config) {
		if (conf instanceof Config) {
			return conf
		}

		if (conf) {
			this.add(conf)
		}
	}

	private key(name: string): string {
		return name
		// return name.toLowerCase();
	}

	all(): ConfigObject {
		return { ...this.conf }
	}

	default(conf: ConfigObject): void {
		for (const name in conf) {
			if (!this.has(name)) {
				this.set(name, conf[name])
			}
		}
	}

	add(conf: ConfigObject): void {
		for (const name in conf) {
			this.set(name, conf[name])
		}
	}

	set(name: string, val: any): any {
		const key = this.key(name)
		this.conf[key] = val
		return val
	}

	has(name: string): boolean {
		return this.key(name) in this.conf
	}

	getRaw(name: string, def?: any): any {
		const key = this.key(name)
		if (!(key in this.conf)) {
			return def
		}

		let val = this.conf[key]
		if (val === null || val === undefined) {
			return def
		}

		while (typeof val === 'string' && val.startsWith('@')) {
			const refKey = val.substring(1)
			val = this.conf[this.key(refKey)] ?? def
		}

		return val
	}

	get(name: string, def?: any): any {
		return this.resolveValue(this.getRaw(name, def))
	}

	remove(name: string): void {
		delete this.conf[this.key(name)]
	}

	resolveValue(value: any): any {
		if (typeof value !== 'string') {
			return value
		}

		return this.unescapeValue(
			value.replace(/%%|%([^%\s]+)%/g, (match, name) => {
				return match === '%%' ? '%%' : this.get(name)
			})
		)
	}

	escapeValue(value: any): any {
		return typeof value === 'string' ? value.replace(/%/g, '%%') : value
	}

	unescapeValue(value: any): any {
		return typeof value === 'string' ? value.replace(/%%/g, '%') : value
	}
}
