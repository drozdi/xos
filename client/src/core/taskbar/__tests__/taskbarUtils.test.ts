import { describe, expect, it } from 'vitest';

import type { WindowState } from '@/core/windowManager/types';

import {
	groupWindowsByWmGroup,
	isGroupActive,
	shouldMinimizeGroup,
} from '../taskbarUtils';

function makeWindow(partial: Partial<WindowState> & Pick<WindowState, 'id' | 'wmGroup'>): WindowState {
	return {
		appId: 'demo',
		instanceKey: partial.id,
		title: partial.title ?? partial.id,
		x: 0,
		y: 0,
		width: 400,
		height: 300,
		zIndex: 100,
		minimized: false,
		maximized: false,
		wmSort: 0,
		contentKey: 0,
		...partial,
	};
}

describe('taskbar group utils', () => {
	it('groups windows by wmGroup and sorts by wmSort', () => {
		const groups = groupWindowsByWmGroup([
			makeWindow({ id: 'b', wmGroup: 'tools', wmSort: 2, title: 'B' }),
			makeWindow({ id: 'a', wmGroup: 'tools', wmSort: 1, title: 'A' }),
			makeWindow({ id: 'c', wmGroup: 'other', wmSort: 0, title: 'C' }),
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0]?.wmGroup).toBe('tools');
		expect(groups[0]?.windows.map((window) => window.id)).toEqual(['a', 'b']);
	});

	it('minimizes group when any window is visible', () => {
		const windows = [
			makeWindow({ id: 'a', wmGroup: 'tools', minimized: true }),
			makeWindow({ id: 'b', wmGroup: 'tools', minimized: false }),
		];

		expect(shouldMinimizeGroup(windows)).toBe(true);
		expect(shouldMinimizeGroup(windows.map((window) => ({ ...window, minimized: true })))).toBe(false);
	});

	it('highlights active group', () => {
		const windows = [makeWindow({ id: 'a', wmGroup: 'tools' })];
		expect(isGroupActive(windows, 'a')).toBe(true);
		expect(isGroupActive(windows, 'missing')).toBe(false);
	});
});
