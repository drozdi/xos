import { describe, expect, it } from 'vitest';

import { toPersistedState } from '../persistWindow';
import type { WindowState } from '../types';

function makeWindow(overrides: Partial<WindowState> = {}): WindowState {
	return {
		id: 'demo__a',
		appId: 'demo',
		instanceKey: 'a',
		title: 'Demo',
		x: 80,
		y: 60,
		width: 800,
		height: 600,
		zIndex: 100,
		minimized: false,
		maximized: false,
		wmGroup: 'default',
		wmSort: 0,
		taskbarGroup: 'demo',
		contentKey: 0,
		resizable: true,
		positionFixed: false,
		autoSize: false,
		...overrides,
	};
}

describe('toPersistedState', () => {
	it('writes current bounds when not maximized', () => {
		const persisted = toPersistedState(makeWindow());

		expect(persisted.position).toEqual({ x: 80, y: 60, width: 800, height: 600 });
		expect(persisted.state.maximized).toBe(false);
	});

	it('writes preMaximize bounds when maximized', () => {
		const persisted = toPersistedState(
			makeWindow({
				maximized: true,
				x: 0,
				y: 0,
				width: 1200,
				height: 800,
				preMaximize: { x: 80, y: 60, width: 800, height: 600 },
			}),
		);

		expect(persisted.position).toEqual({ x: 80, y: 60, width: 800, height: 600 });
		expect(persisted.state.maximized).toBe(true);
	});
});
