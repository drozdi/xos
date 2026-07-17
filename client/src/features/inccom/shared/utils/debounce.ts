/**
 * Функция debounce создает функцию, которая будет вызвана не чаще, чем через заданный интервал времени.
 * @param {Function} fn - Функция, которую нужно задержать.
 * @param {number} [delay=200] - Интервал времени в миллисекундах.
 * @returns {Function} - Задержанная функция.
 */
export function debounce(fn: Function, delay: number = 200): Function {
	let timer: NodeJS.Timeout

	const func = (...args: any[]): void => {
		if (timer) {
			clearTimeout(timer)
		}
		timer = setTimeout(() => fn(...args), delay)
	}

	// Добавляем метод для отмены
	func.cancel = (): void => {
		if (timer) {
			clearTimeout(timer)
		}
	}

	// Добавляем метод для немедленного вызова
	func.flush = (...args: any[]): void => {
		if (timer) {
			func(...args)
		}
	}

	return func
}
