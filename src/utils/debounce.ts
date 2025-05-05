export type DebouncedFunction = {
	(...args: any[]): void;
	cancel: () => void;
	flush: () => void;
};

/**
 * Функция debounce создает функцию, которая будет вызвана не чаще, чем через заданный интервал времени.
 * @param {Function} fn - Функция, которую нужно задержать.
 * @param {number} delay - Интервал времени в миллисекундах.
 * @returns {Function} - Задержанная функция.
 */
export function debounce(
	fn: (...args: any[]) => void,
	delay: number = 0,
): DebouncedFunction {
	let timer: number | null = null;

	const func = (...args: any[]) => {
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
	func.flush = (...args: any[]) => {
		if (timer) {
			clearTimeout(timer);
			fn(...args);
		}
	};

	return func;
}
