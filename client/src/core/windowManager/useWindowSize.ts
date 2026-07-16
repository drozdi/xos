import { createContext, useContext, useEffect, useState, type RefObject } from 'react';

export interface WindowSize {
	width: number;
	height: number;
}

/**
 * Returns current window content dimensions from WindowSizeContext.
 *
 * Usage inside window content:
 * - CSS variables: `var(--window-width)`, `var(--window-height)` on the content root
 * - Tailwind arbitrary: `min-[640px]:grid-cols-2` with parent `data-window-width` attribute
 * - Breakpoints from `styles/window-breakpoints.css`: window-sm (640), window-md (768), window-lg (1024)
 */
export function useWindowSize(): WindowSize {
	const context = useContext(WindowSizeContext);
	if (!context) {
		throw new Error('useWindowSize must be used within a Window content tree');
	}
	return context;
}

export const WindowSizeContext = createContext<WindowSize | null>(null);

export function useObserveWindowSize(elementRef: RefObject<HTMLElement | null>): WindowSize {
	const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });

	useEffect(() => {
		const element = elementRef.current;
		if (!element) {return;}

		const updateSize = (width: number, height: number) => {
			const nextWidth = Math.round(width);
			const nextHeight = Math.round(height);
			setSize((current) =>
				current.width === nextWidth && current.height === nextHeight
					? current
					: { width: nextWidth, height: nextHeight },
			);
		};

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {return;}
			const { width, height } = entry.contentRect;
			updateSize(width, height);
		});

		observer.observe(element);
		updateSize(element.clientWidth, element.clientHeight);

		return () => {
			observer.disconnect();
		};
	}, [elementRef]);

	return size;
}
