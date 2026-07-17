/**
 * Функция cached создает кэширующую обертку для переданной функции.
 * @param {Function} fn - Функция, которую нужно кэшировать.
 * @returns {Function} - Кэширующая обертка для переданной функции.
 */
export function cached<T>(fn: Function) {
	var cache = Object.create(null)
	return function cachedFn(...args: any[]): T {
		var hit = cache[args.join('-')]
		return hit || (cache[args.join('-')] = fn(...args))
	}
}

export function cachedAsync<T>(fn: Function) {
	var cache = Object.create(null)
	return async function cachedFn(...args: any[]): Promise<T> {
		var hit = cache[args.join('-')]
		return hit || (cache[args.join('-')] = await fn(...args))
	}
}
