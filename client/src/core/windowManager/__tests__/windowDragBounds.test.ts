import { describe, expect, it } from 'vitest';

import {
	fitRectToDesktop,
	getContainedDragBounds,
	getWindowDragBounds,
	snapAppToDesktopEdges,
} from '../windowDragBounds';

describe('getWindowDragBounds', () => {
	it('keeps at least margin px visible on each edge', () => {
		const bounds = getWindowDragBounds(
			{ width: 1000, height: 800 },
			{ width: 400, height: 300 },
			50,
		);

		expect(bounds).toEqual({
			left: -350,
			top: -250,
			right: 950,
			bottom: 750,
		});
	});

	it('returns zero bounds for empty viewport', () => {
		expect(getWindowDragBounds({ width: 0, height: 0 }, { width: 400, height: 300 }, 50)).toEqual({
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
		});
	});
});

describe('getContainedDragBounds', () => {
	it('keeps the widget fully inside the desktop', () => {
		expect(
			getContainedDragBounds({ width: 1000, height: 700 }, { width: 220, height: 96 }),
		).toEqual({
			left: 0,
			top: 0,
			right: 780,
			bottom: 604,
		});
	});

	it('fits a widget rect inside the desktop', () => {
		expect(
			fitRectToDesktop(
				{ width: 800, height: 600 },
				{ x: 700, y: 500, width: 300, height: 200 },
				{ width: 80, height: 48 },
			),
		).toEqual({ x: 500, y: 400, width: 300, height: 200 });
	});
});

describe('snapAppToDesktopEdges', () => {
	const viewport = { width: 1000, height: 800 };
	const size = { width: 400, height: 300 };

	it('snaps to the left half', () => {
		expect(snapAppToDesktopEdges(viewport, { x: 0, y: 100 }, size)).toEqual({
			x: 0,
			y: 0,
			width: 500,
			height: 800,
		});
	});

	it('snaps to the top-right quarter', () => {
		expect(snapAppToDesktopEdges(viewport, { x: 700, y: 0 }, size)).toEqual({
			x: 500,
			y: 0,
			width: 500,
			height: 400,
		});
	});

	it('leaves a window in the middle alone', () => {
		expect(snapAppToDesktopEdges(viewport, { x: 200, y: 200 }, size)).toBeNull();
	});
});

describe('getContainedDragBounds extra', () => {
	it('pins to the origin when the widget is larger than the desktop', () => {
		expect(
			getContainedDragBounds({ width: 200, height: 80 }, { width: 220, height: 300 }),
		).toEqual({
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
		});
	});
});
