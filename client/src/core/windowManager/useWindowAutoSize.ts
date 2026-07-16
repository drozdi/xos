import { useEffect, useRef } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';

import { clampWindowSize, type WindowAutoSizeMode, type WindowLayoutBounds } from './windowLayout';
import { useWmStore } from './useWmStore';

interface UseWindowAutoSizeOptions {
	windowId: string;
	appId: string;
	contentRef: React.RefObject<HTMLElement | null>;
	titlebarHeight: number;
	autoSize: WindowAutoSizeMode;
	contentKey?: number;
}

function measureContentSize(
	root: HTMLElement,
	titlebarHeight: number,
	mode: WindowAutoSizeMode,
): { width?: number; height?: number } {
	const content = root.querySelector('[data-xos-window-content]') as HTMLElement | null;
	const target = content ?? root;

	if (mode === 'width') {
		return { width: Math.ceil(target.scrollWidth) };
	}

	if (mode === 'height') {
		return { height: Math.ceil(target.scrollHeight) + titlebarHeight };
	}

	return {
		width: Math.ceil(target.scrollWidth),
		height: Math.ceil(target.scrollHeight) + titlebarHeight,
	};
}

function getLayoutBounds(appId: string, defaults: WindowLayoutBounds): WindowLayoutBounds {
	const manifest = AppRegistry.get(appId);
	return {
		minWidth: manifest?.minSize?.width ?? defaults.minWidth,
		minHeight: manifest?.minSize?.height ?? defaults.minHeight,
		maxWidth: defaults.maxWidth,
		maxHeight: defaults.maxHeight,
	};
}

export function useWindowAutoSize({
	windowId,
	appId,
	contentRef,
	titlebarHeight,
	autoSize,
	contentKey,
}: UseWindowAutoSizeOptions) {
	const frameRef = useRef<number | null>(null);

	useEffect(() => {
		if (!autoSize) {
			return undefined;
		}

		const root = contentRef.current;
		if (!root) {
			return undefined;
		}

		const target =
			(root.querySelector('[data-xos-window-content]') as HTMLElement | null) ?? root;

		const applySize = () => {
			const windowState = useWmStore.getState().windows[windowId];
			if (!windowState) {
				return;
			}

			const measured = measureContentSize(root, titlebarHeight, autoSize);
			const bounds = getLayoutBounds(appId, {
				minWidth: 280,
				minHeight: 200,
				maxWidth: window.innerWidth,
				maxHeight: window.innerHeight,
			});

			const nextWidth = measured.width ?? windowState.width;
			const nextHeight = measured.height ?? windowState.height;
			const clamped = clampWindowSize(nextWidth, nextHeight, bounds);

			if (
				clamped.width === windowState.width &&
				clamped.height === windowState.height
			) {
				return;
			}

			useWmStore.getState().updateWindow(windowId, clamped);
		};

		const schedule = () => {
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}
			frameRef.current = requestAnimationFrame(() => {
				frameRef.current = null;
				applySize();
			});
		};

		schedule();

		const observer = new ResizeObserver(schedule);
		observer.observe(target);

		return () => {
			observer.disconnect();
			if (frameRef.current !== null) {
				cancelAnimationFrame(frameRef.current);
			}
		};
	}, [appId, autoSize, contentKey, contentRef, titlebarHeight, windowId]);
}

export function fitWindowToContent(
	windowId: string,
	contentRoot: HTMLElement,
	titlebarHeight: number,
	bounds: WindowLayoutBounds,
): void {
	const measured = measureContentSize(contentRoot, titlebarHeight, true);
	const windowState = useWmStore.getState().windows[windowId];
	if (!windowState) {
		return;
	}

	const clamped = clampWindowSize(
		measured.width ?? windowState.width,
		measured.height ?? windowState.height,
		bounds,
	);

	useWmStore.getState().updateWindow(windowId, clamped);
}
