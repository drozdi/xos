import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '../utils/debounce'; // Или любая другая библиотека для дебаунсинга

/**
 * Функция useElementResizeObserver создает обработчик для отслеживания изменения размера элемента.
 * @param {Object} [options] - Объект с опциями.
 * @param {HTMLElement} [options.element=null] - Элемент, который нужно отслеживать.
 * @param {Function} [options.onResize] - Функция, которая будет вызвана при изменении размера элемента.
 * @param {number} [options.debounceTime=200] - Время задержки перед вызовом функции onResize.
 * @param {string} [options.boxModel="content-box"] - Модель размера контейнера ("content-box" или "border-box").
 * @returns {Object} - Объект, содержащий ссылку на элемент и текущие размеры элемента.
 */

export interface RectSize {
	width: number;
	height: number;
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export interface useElementResizeObserverProps {
	element?: HTMLElement | null;
	onResize?: (size: RectSize) => void;
	debounceTime?: number;
	boxModel: 'border-box' | 'content-box';
}

const initial: RectSize = {
	width: 0,
	height: 0,
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
};

export function useElementResizeObserver({
	element = null,
	onResize,
	debounceTime = 200,
	boxModel = 'content-box',
}: useElementResizeObserverProps) {
	const [size, setSize] = useState<RectSize>(initial);
	const ref = useRef<HTMLElement | null>(element);
	const observerRef = useRef<ResizeObserver | null>(null);
	const latestSizeRef = useRef<RectSize>(initial);

	const handleResize = useCallback(
		(entries: ResizeObserverEntry[]) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			const rect = entry.contentRect;
			const newSize: RectSize = {
				width: rect.width,
				height: rect.height,
				top: rect.top,
				left: rect.left,
				bottom: rect.bottom,
				right: rect.right,
			};

			if (boxModel === 'border-box') {
				const borderBoxSize = entry.borderBoxSize?.[0];
				if (borderBoxSize) {
					newSize.width = borderBoxSize.inlineSize;
					newSize.height = borderBoxSize.blockSize;
				}
			}

			// Проверяем, изменились ли размеры элемента и вызываем функцию onResize, если это так
			if (JSON.stringify(newSize) !== JSON.stringify(latestSizeRef.current)) {
				latestSizeRef.current = newSize;
				setSize(newSize);
				onResize?.(rect);
			}
		},
		[onResize, boxModel],
	);

	const debouncedResize = useCallback(debounce(handleResize, debounceTime ?? 200), [
		handleResize,
		debounceTime,
	]);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		observerRef.current = new ResizeObserver(debouncedResize);
		observerRef.current.observe(ref.current);

		return () => {
			observerRef.current?.disconnect();
			debouncedResize.cancel?.();
		};
	}, [debouncedResize]);

	return { ref, getSnapshot: () => latestSizeRef.current, ...size };
}
