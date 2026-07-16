import { describe, expect, it } from 'vitest';

import {
	clampWindowSize,
	resolveInitialWindowPosition,
	resolveWindowLayoutConfig,
} from '../windowLayout';

describe('resolveWindowLayoutConfig', () => {
	it('returns defaults when config is omitted', () => {
		expect(resolveWindowLayoutConfig()).toEqual({
			resizable: true,
			positionFixed: false,
			autoSize: false,
		});
	});

	it('applies explicit layout flags', () => {
		expect(
			resolveWindowLayoutConfig({
				resizable: false,
				positionFixed: true,
				autoSize: 'height',
			}),
		).toEqual({
			resizable: false,
			positionFixed: true,
			autoSize: 'height',
		});
	});
});

describe('resolveInitialWindowPosition', () => {
	it('uses default position when not fixed', () => {
		expect(resolveInitialWindowPosition(undefined, { x: 10, y: 20 })).toEqual({
			x: 10,
			y: 20,
			positionFixed: false,
		});
	});

	it('marks position as fixed without coordinates', () => {
		expect(resolveInitialWindowPosition({ positionFixed: true }, { x: 10, y: 20 })).toEqual({
			x: 10,
			y: 20,
			positionFixed: true,
		});
	});

	it('uses explicit coordinates when position is fixed', () => {
		expect(
			resolveInitialWindowPosition({ positionFixed: { x: 100, y: 200 } }, { x: 10, y: 20 }),
		).toEqual({
			x: 100,
			y: 200,
			positionFixed: true,
		});
	});
});

describe('clampWindowSize', () => {
	it('clamps to min and max bounds', () => {
		expect(
			clampWindowSize(100, 100, {
				minWidth: 200,
				minHeight: 150,
				maxWidth: 400,
				maxHeight: 300,
			}),
		).toEqual({ width: 200, height: 150 });

		expect(
			clampWindowSize(800, 900, {
				minWidth: 200,
				minHeight: 150,
				maxWidth: 400,
				maxHeight: 300,
			}),
		).toEqual({ width: 400, height: 300 });
	});
});
