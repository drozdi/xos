/**
 * Функция cached создает кэширующую обертку для переданной функции.
 * @param {Function} fn - Функция, которую нужно кэшировать.
 * @returns {Function} - Кэширующая обертка для переданной функции.
 */
export function cached(fn) {
	var cache = Object.create(null);
	return function cachedFn(...args) {
		var hit = cache[args.join("-")];
		return hit || (cache[args.join("-")] = fn(...args));
	};
}
