interface Size {
	width: number;
	height: number;
}

export function getWindowDragBounds(
	viewport: Size,
	windowSize: Size,
	margin: number,
): { left: number; top: number; right: number; bottom: number } {
	const { width: viewportWidth, height: viewportHeight } = viewport;
	const { width: windowWidth, height: windowHeight } = windowSize;

	if (viewportWidth <= 0 || viewportHeight <= 0) {
		return { left: 0, top: 0, right: 0, bottom: 0 };
	}

	const minX = margin - windowWidth;
	const minY = margin - windowHeight;
	const maxX = viewportWidth - margin;
	const maxY = viewportHeight - margin;

	return {
		left: minX,
		top: minY,
		right: Math.max(minX, maxX),
		bottom: Math.max(minY, maxY),
	};
}

/** Widget must stay fully inside the desktop (top-left cannot leave this box). */
export function getContainedDragBounds(
	viewport: Size,
	windowSize: Size,
): { left: number; top: number; right: number; bottom: number } {
	const { width: viewportWidth, height: viewportHeight } = viewport;
	const { width: windowWidth, height: windowHeight } = windowSize;

	if (viewportWidth <= 0 || viewportHeight <= 0) {
		return { left: 0, top: 0, right: 0, bottom: 0 };
	}

	return {
		left: 0,
		top: 0,
		right: Math.max(0, viewportWidth - windowWidth),
		bottom: Math.max(0, viewportHeight - windowHeight),
	};
}

export interface DesktopRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Keep a widget fully inside the desktop, respecting a minimum size. */
export function fitRectToDesktop(viewport: Size, rect: DesktopRect, min: Size): DesktopRect {
	const maxWidth = Math.max(min.width, viewport.width);
	const maxHeight = Math.max(min.height, viewport.height);
	const width = Math.min(Math.max(rect.width, min.width), maxWidth);
	const height = Math.min(Math.max(rect.height, min.height), maxHeight);
	const x = Math.min(Math.max(0, rect.x), Math.max(0, viewport.width - width));
	const y = Math.min(Math.max(0, rect.y), Math.max(0, viewport.height - height));
	return { x, y, width, height };
}

/**
 * Snap an app window to a half or quarter when it is dropped against a desktop edge.
 * Returns null when the window is not touching an edge.
 */
export function snapAppToDesktopEdges(
	viewport: Size,
	position: { x: number; y: number },
	size: Size,
	edge = 28,
): DesktopRect | null {
	if (viewport.width <= 0 || viewport.height <= 0) {
		return null;
	}
	const nearLeft = position.x <= edge;
	const nearTop = position.y <= edge;
	const nearRight = position.x + size.width >= viewport.width - edge;
	const nearBottom = position.y + size.height >= viewport.height - edge;
	const halfW = Math.floor(viewport.width / 2);
	const halfH = Math.floor(viewport.height / 2);

	if (nearLeft && nearRight) {
		return null;
	}
	if (nearTop && nearBottom) {
		return null;
	}

	if (nearLeft && nearTop) {
		return { x: 0, y: 0, width: halfW, height: halfH };
	}
	if (nearRight && nearTop) {
		return { x: viewport.width - halfW, y: 0, width: halfW, height: halfH };
	}
	if (nearLeft && nearBottom) {
		return { x: 0, y: viewport.height - halfH, width: halfW, height: halfH };
	}
	if (nearRight && nearBottom) {
		return { x: viewport.width - halfW, y: viewport.height - halfH, width: halfW, height: halfH };
	}
	if (nearLeft) {
		return { x: 0, y: 0, width: halfW, height: viewport.height };
	}
	if (nearRight) {
		return { x: viewport.width - halfW, y: 0, width: halfW, height: viewport.height };
	}
	if (nearTop) {
		return { x: 0, y: 0, width: viewport.width, height: halfH };
	}
	if (nearBottom) {
		return { x: 0, y: viewport.height - halfH, width: viewport.width, height: halfH };
	}
	return null;
}
