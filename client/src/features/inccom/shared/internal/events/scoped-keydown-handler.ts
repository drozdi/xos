type Elem = HTMLElement & { disabled?: boolean }

/**
 * Функция getPreviousIndex возвращает индекс предыдущего элемента, который не отключен.
 * @param {number} current - Текущий индекс.
 * @param {Array} elements - Массив элементов.
 * @param {boolean} loop - Флаг, указывающий на то, нужно ли зацикливать поиск.
 * @returns {number} - Индекс предыдущего элемента, который не отключен.
 */
function getPreviousIndex(current: number, elements: Elem[], loop: boolean) {
	for (let i = current - 1; i >= 0; i -= 1) {
		if (!elements[i].disabled) {
			return i
		}
	}

	if (loop) {
		for (let i = elements.length - 1; i > -1; i -= 1) {
			if (!elements[i].disabled) {
				return i
			}
		}
	}

	return current
}

/**
 * Функция getNextIndex возвращает индекс следующего элемента, который не отключен.
 * @param {number} current - Текущий индекс.
 * @param {Array} elements - Массив элементов.
 * @param {boolean} loop - Флаг, указывающий на то, нужно ли зацикливать поиск.
 * @returns {number} - Индекс следующего элемента, который не отключен.
 */
function getNextIndex(current: number, elements: Elem[], loop: boolean) {
	for (let i = current + 1; i < elements.length; i += 1) {
		if (!elements[i].disabled) {
			return i
		}
	}

	if (loop) {
		for (let i = 0; i < elements.length; i += 1) {
			if (!elements[i].disabled) {
				return i
			}
		}
	}

	return current
}

/**
 * Функция scopedKeydownHandler создает обработчик нажатия клавиш, который обрабатывает навигацию по элементам.
 * @param {Object} options - Параметры обработчика.
 * @param {string} options.parentSelector - Селектор родительского элемента.
 * @param {string} options.siblingSelector - Селектор элементов-братьев.
 * @param {Function} options.onKeyDown - Обработчик нажатия клавиш.
 * @param {boolean} [options.loop=true] - Флаг, указывающий на то, нужно ли зацикливать навигацию.
 * @param {boolean} [options.activateOnFocus=false] - Флаг, указывающий на то, нужно ли активировать элемент при фокусе.
 * @param {Array} options.orientation - Ориентация навигации.
 * @returns {Function} - Обработчик нажатия клавиш.
 */
export function scopedKeydownHandler({
	parentSelector,
	siblingSelector,
	onKeyDown,
	loop = true,
	activateOnFocus = false,
	orientation,
}: {
	parentSelector: string
	siblingSelector: string
	onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
	loop?: boolean
	activateOnFocus?: boolean
	orientation: 'x' | 'y' | 'xy' | 'yx'
}) {
	return (event: React.KeyboardEvent<HTMLElement>) => {
		onKeyDown?.(event)
		const target = event.target as HTMLElement | null

		const elements: Elem[] = Array.from(target?.closest(parentSelector).querySelectorAll(siblingSelector) || [])

		const current = elements.findIndex(el => target === el)
		const nextIndex = getNextIndex(current, elements, loop)
		const previousIndex = getPreviousIndex(current, elements, loop)

		switch (event.code) {
			case 'ArrowLeft': {
				if (orientation.includes('y')) {
					event.stopPropagation()
					event.preventDefault()
					elements[previousIndex]?.focus()
					activateOnFocus && elements[previousIndex]?.click()
				}
				break
			}
			case 'ArrowRight': {
				if (orientation.includes('y')) {
					event.stopPropagation()
					event.preventDefault()
					elements[nextIndex]?.focus()
					activateOnFocus && elements[nextIndex]?.click()
				}
				break
			}
			case 'ArrowDown': {
				if (orientation.includes('x')) {
					event.stopPropagation()
					event.preventDefault()
					elements[nextIndex]?.focus()
					activateOnFocus && elements[nextIndex]?.click()
				}
				break
			}
			case 'ArrowUp': {
				if (orientation.includes('x')) {
					event.stopPropagation()
					event.preventDefault()
					elements[previousIndex]?.focus()
					activateOnFocus && elements[previousIndex]?.click()
				}
				break
			}
			case 'Home': {
				event.stopPropagation()
				event.preventDefault()
				!elements[0]?.disabled && elements[0]?.focus()
				break
			}
			case 'End': {
				event.stopPropagation()
				event.preventDefault()
				const last = elements.length - 1
				!elements[last]?.disabled && elements[last]?.focus()
				break
			}
		}
	}
}
