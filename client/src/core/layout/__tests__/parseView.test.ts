import { describe, expect, it } from 'vitest';

import { parseView } from '../parseView';

describe('parseView', () => {
	it('parses "hhh lmr ffr" into expected grid areas', () => {
		const parsed = parseView('hhh lmr ffr', { left: 280, right: 280 });

		expect(parsed.columns).toBe(3);
		expect(parsed.rows).toBe(3);
		expect(parsed.templateAreas).toBe(
			'"header header header"\n"left main right"\n"footer footer right"',
		);
		expect(parsed.templateColumns).toBe('280px 1fr 280px');
		expect(parsed.templateRows).toBe('auto 1fr 48px');

		expect(parsed.areas.header).toEqual({ row: 0, col: 0, rowSpan: 1, colSpan: 3 });
		expect(parsed.areas.left).toEqual({ row: 1, col: 0, rowSpan: 1, colSpan: 1 });
		expect(parsed.areas.main).toEqual({ row: 1, col: 1, rowSpan: 1, colSpan: 1 });
		expect(parsed.areas.right).toEqual({ row: 1, col: 2, rowSpan: 2, colSpan: 1 });
		expect(parsed.areas.footer).toEqual({ row: 2, col: 0, rowSpan: 1, colSpan: 2 });
	});

	it('supports single-column mobile layouts', () => {
		const parsed = parseView('h m f');

		expect(parsed.columns).toBe(1);
		expect(parsed.rows).toBe(3);
		expect(parsed.templateAreas).toBe('"header"\n"main"\n"footer"');
		expect(parsed.templateColumns).toBe('1fr');
		expect(parsed.templateRows).toBe('auto 1fr 48px');
	});

	it('throws on unknown area letters', () => {
		expect(() => parseView('xyz')).toThrow('Unknown layout area letter');
	});
});
