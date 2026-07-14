import { beforeEach, describe, expect, it } from 'vitest';

import { clearPersistTimers } from '../persistWindow';
import { useWmStore } from '../useWmStore';

describe('useWmStore', () => {
	beforeEach(() => {
		clearPersistTimers();
		useWmStore.setState({
			windows: {},
			activeWindowId: null,
			nextZIndex: 100,
		});
	});

	it('assigns incrementing zIndex and focuses new window on openWindow', () => {
		const firstId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'a',
			title: 'First',
		});
		const secondId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'b',
			title: 'Second',
		});

		const state = useWmStore.getState();
		expect(state.windows[firstId]?.zIndex).toBe(100);
		expect(state.windows[secondId]?.zIndex).toBe(101);
		expect(state.activeWindowId).toBe(secondId);
	});

	it('brings focused window to front with highest zIndex', () => {
		const firstId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'a',
			title: 'First',
		});
		const secondId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'b',
			title: 'Second',
		});

		useWmStore.getState().focusWindow(firstId);

		const state = useWmStore.getState();
		expect(state.activeWindowId).toBe(firstId);
		expect(state.windows[firstId]?.zIndex).toBe(102);
		expect(state.windows[secondId]?.zIndex).toBe(101);
	});

	it('tracks minimize and maximize state', () => {
		const windowId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'a',
			title: 'Demo',
		});

		useWmStore.getState().minimizeWindow(windowId);
		expect(useWmStore.getState().windows[windowId]?.minimized).toBe(true);

		useWmStore.getState().maximizeWindow(windowId, {
			x: 0,
			y: 0,
			width: 1200,
			height: 800,
		});

		const maximized = useWmStore.getState().windows[windowId];
		expect(maximized?.maximized).toBe(true);
		expect(maximized?.width).toBe(1200);
		expect(maximized?.preMaximize).toEqual({
			x: expect.any(Number),
			y: expect.any(Number),
			width: expect.any(Number),
			height: expect.any(Number),
		});

		useWmStore.getState().restoreWindow(windowId);
		const restored = useWmStore.getState().windows[windowId];
		expect(restored?.maximized).toBe(false);
		expect(restored?.minimized).toBe(false);
	});

	it('increments contentKey on refresh via updateWindow', () => {
		const windowId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'a',
			title: 'Demo',
		});

		useWmStore.getState().updateWindow(windowId, { contentKey: 1 });
		expect(useWmStore.getState().windows[windowId]?.contentKey).toBe(1);
	});

	it('groups windows and supports minimize/restore group actions', () => {
		const firstId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'a',
			title: 'First',
			wmGroup: 'tools',
			wmSort: 1,
		});
		const secondId = useWmStore.getState().openWindow({
			appId: 'demo',
			instanceKey: 'b',
			title: 'Second',
			wmGroup: 'tools',
			wmSort: 2,
		});

		const grouped = useWmStore.getState().getWindowsByGroup('tools');
		expect(grouped).toHaveLength(2);

		useWmStore.getState().minimizeGroup('tools');
		expect(useWmStore.getState().windows[firstId]?.minimized).toBe(true);
		expect(useWmStore.getState().windows[secondId]?.minimized).toBe(true);

		useWmStore.getState().restoreGroup('tools');
		expect(useWmStore.getState().windows[secondId]?.minimized).toBe(false);
		expect(useWmStore.getState().activeWindowId).toBe(secondId);
	});
});
