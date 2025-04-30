/**
 * Функция debounce создает функцию, которая будет вызвана не чаще, чем через заданный интервал времени.
 * @param {Function} fn - Функция, которую нужно задержать.
 * @param {number} delay - Интервал времени в миллисекундах.
 * @returns {Function} - Задержанная функция.
 */
export function debounce(fn, delay) {
	let timer;

	const func = (...args) => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => fn(...args), delay);
	};

	// Добавляем метод для отмены
	func.cancel = () => {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	};

	// Добавляем метод для немедленного вызова
	func.flush = (...args) => {
		if (timer) {
			clearTimeout(timer);
			fn(...args);
		}
	};

	return func;
}
