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
