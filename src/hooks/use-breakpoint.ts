import { useMemo } from 'react';

/**
 * Функция useBreakpoint проверяет, превышает ли текущая ширина контекста заданный breakpoint.
 * @param {number} breakpoint - Значение breakpoint.
 * @param {number} ctxWidth - Текущая ширина контекста.
 * @returns {boolean} - Возвращает true, если текущая ширина контекста меньше заданного breakpoint, иначе false.
 */
export function useBreakpoint(breakpoint: number | null, ctxWidth: number): boolean {
	return useMemo<boolean>(() => {
		// Проверяем валидность брейкпоинта
		const isValidBreakpoint = typeof breakpoint === 'number' && !isNaN(breakpoint);

		// Проверяем валидность ширины контекста
		const isValidWidth = typeof ctxWidth === 'number' && !isNaN(ctxWidth);

		// Возвращаем false при невалидных данных
		if (!isValidBreakpoint || !isValidWidth) return false;

		return ctxWidth < breakpoint;
	}, [breakpoint, ctxWidth]);
}
