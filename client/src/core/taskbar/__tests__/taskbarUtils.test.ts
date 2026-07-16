import { describe, expect, it } from 'vitest';

import type { AppManifest } from '@/core/appManager/types';
import type { WindowState } from '@/core/windowManager/types';

import {
	groupWindowsByTaskbarGroup,
	isGroupActive,
	resolveTaskbarGroup,
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
		resizable: true,
		positionFixed: false,
		autoSize: false,
		taskbarGroup: partial.taskbarGroup ?? partial.id,
		...partial,
	};
}

describe('taskbar group utils', () => {
	it('resolves taskbarGroup from manifest with app id fallback', () => {
		const app = {
			id: 'sudoku',
			taskbarGroup: 'games',
		} as AppManifest;

		expect(resolveTaskbarGroup(app)).toBe('games');
		expect(resolveTaskbarGroup({ id: 'settings' } as AppManifest)).toBe('settings');
	});

	it('groups windows by taskbarGroup and sorts by wmSort', () => {
		const groups = groupWindowsByTaskbarGroup([
			makeWindow({ id: 'b', wmGroup: 'tools', taskbarGroup: 'tools', wmSort: 2, title: 'B' }),
			makeWindow({ id: 'a', wmGroup: 'tools', taskbarGroup: 'tools', wmSort: 1, title: 'A' }),
			makeWindow({ id: 'c', wmGroup: 'other', taskbarGroup: 'other', wmSort: 0, title: 'C' }),
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0]?.taskbarGroup).toBe('tools');
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
