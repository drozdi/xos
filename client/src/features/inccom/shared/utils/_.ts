function isArray(value: unknown): boolean {
	if (Array.isArray) {
		return Array.isArray(value)
	} else {
		return Object.prototype.toString.call(value) === '[object Array]'
	}
}
function isBoolean(value: unknown): boolean {
	return typeof value === 'boolean'
}
function isObject(value: unknown): boolean {
	return value !== null && typeof value === 'object' && !!value
}
function isSymbol(value: unknown): boolean {
	if (typeof Symbol === 'function') {
		return typeof value === 'symbol'
	} else {
		return Object.prototype.toString.call(value) === '[object Symbol]'
	}
}

function last(array: unknown[]): unknown {
	const length = array == null ? 0 : array.length
	return length ? array[length - 1] : undefined
}
function isKey(value: unknown, object: Record<string, any>): boolean {
	if (isArray(value)) {
		return false
	}
	const type = typeof value
	if (type === 'number' || type === 'boolean' || value == null || isSymbol(value)) {
		return true
	}
	return object != null && (value as string) in Object(object)
}
function toKey(value: unknown): string {
	if (typeof value === 'string' || isSymbol(value)) {
		return value as string
	}
	return `${value}`
}
function parent(object: Record<string, any>, path: string[]): unknown {
	return path.length < 2 ? object : get(object, path.slice(0, -1))
}
function castPath(value: string | string[], object: Record<string, any>): string[] {
	if (isArray(value)) {
		return value as string[]
	}
	return (isKey(value, object) ? [value] : (value as string).split('.')) as string[]
}
export function get(object: Record<string, any>, path: string | string[]): unknown {
	path = castPath(path, object) as string[]

	let index = 0
	const length = path.length

	while (object != null && index < length) {
		object = object[toKey(path[index++])]
	}
	return index && index === length ? object : undefined
}
export function set(object: Record<string, any>, path: any, value: any): Record<string, any> {
	if (!isObject(object)) {
		return object
	}
	path = castPath(path, object) as string[]

	const length = path.length
	const lastIndex = length - 1

	let index = -1
	let nested = object

	while (nested != null && ++index < lastIndex) {
		const key = toKey(path[index])
		nested[key] = nested[key] || {}
		nested = nested[key]
	}

	nested[toKey(last(path))] = value

	return object
}
export function unset(object: Record<string, any>, path: string | string[]) {
	path = castPath(path, object)
	object = parent(object, path) as Record<string, any>
	return object == null || delete object[toKey(last(path))]
}

export function merge(target: Record<string, any>, ...sources: Record<string, any>[]) {
	let deep: unknown = sources.pop()
	if (!isBoolean(deep)) {
		sources.push(deep as Record<string, any>)
		deep = false
	}
	if (!sources.length) {
		return target
	}
	if (deep === false) {
		return Object.assign(target, ...sources)
	}
	const source = sources.shift()
	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) {
					Object.assign(target, {
						[key]: {},
					})
				}
				merge(target[key], source[key], deep as Record<string, any>)
			} else {
				Object.assign(target, {
					[key]: source[key],
				})
			}
		}
	}
	return merge(target, ...sources, deep as Record<string, any>)
}
