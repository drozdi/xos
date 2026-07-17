/**
 * Функция nextTick выполняет переданную функцию в следующем тике цикла событий.
 * @param {Function} [fn=() => {}] - Функция, которую нужно выполнить.
 * @param {*} [ctx] - Контекст выполнения функции.
 * @returns {Promise} - Промис, который будет выполнен после выполнения функции.
 */
export function nextTick(fn = function () {}, ctx: unknown) {
	return Promise.resolve().then(fn.bind(ctx))
}
