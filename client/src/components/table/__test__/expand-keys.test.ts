import { describe, expect, it } from 'vitest';

import { updateExpandKindKeys } from '../utils/expand-keys';

describe('updateExpandKindKeys', () => {
	it('toggles a single key when multiple is allowed', () => {
		expect(updateExpandKindKeys(['a'], 'b', undefined, true)).toEqual(['a', 'b']);
		expect(updateExpandKindKeys(['a', 'b'], 'a', undefined, true)).toEqual(['b']);
	});

	it('replaces with a single key when multiple is disabled', () => {
		expect(updateExpandKindKeys(['a'], 'b', undefined, false)).toEqual(['b']);
		expect(updateExpandKindKeys(['b'], 'b', undefined, false)).toEqual([]);
	});

	it('supports merge and remove for key arrays', () => {
		expect(updateExpandKindKeys(['a'], ['b', 'c'], { merge: true }, true)).toEqual([
			'a',
			'b',
			'c',
		]);
		expect(updateExpandKindKeys(['a', 'b', 'c'], ['b'], { remove: true }, true)).toEqual([
			'a',
			'c',
		]);
		expect(updateExpandKindKeys(['a'], ['x'], undefined, true)).toEqual(['x']);
	});
});
