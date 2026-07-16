import { describe, expect, it } from 'vitest';

import { getWindowDragBounds } from '../windowDragBounds';

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
