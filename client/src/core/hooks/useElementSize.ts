import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Размер DOM-элемента через ResizeObserver (замена `@mantine/hooks`). */
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const observerRef = useRef<ResizeObserver | null>(null);
	const elementRef = useRef<T | null>(null);

	const ref = useCallback((node: T | null) => {
		if (observerRef.current) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}
		elementRef.current = node;
		if (!node) {
			return;
		}
		const update = () => {
			setSize({ width: node.offsetWidth, height: node.offsetHeight });
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		observerRef.current = observer;
	}, []);

	useLayoutEffect(() => {
		return () => {
			observerRef.current?.disconnect();
			observerRef.current = null;
		};
	}, []);

	return { ref, width: size.width, height: size.height };
}
