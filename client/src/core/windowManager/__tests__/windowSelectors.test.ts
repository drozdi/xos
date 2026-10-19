import { beforeEach, describe, expect, it } from 'vitest';
import { shallow } from 'zustand/shallow';

import { clearPersistTimers } from '../persistWindow';
import { useWmStore } from '../useWmStore';
import { selectContentWindow, selectTaskbarSignature, selectVisibleWindowIds } from '../windowSelectors';

/** Counts store notifications that would re-render a component using `selector` + `equals`. */
function countRenders<T>(selector: (state: ReturnType<typeof useWmStore.getState>) => T, equals: (a: T, b: T) => boolean) {
	let renders = 0;
	let previous = selector(useWmStore.getState());
	const unsubscribe = useWmStore.subscribe((state) => {
		const next = selector(state);
		if (!equals(previous, next)) {
			renders += 1;
			previous = next;
		}
	});
	return {
		get renders() {
			return renders;
		},
		unsubscribe,
	};
}

function openTwoWindows() {
	const first = useWmStore.getState().openWindow({ appId: 'demo', instanceKey: 'a', title: 'First' });
	const second = useWmStore.getState().openWindow({ appId: 'demo', instanceKey: 'b', title: 'Second' });
	return { first, second };
}

describe('windowSelectors', () => {
	beforeEach(() => {
		clearPersistTimers();
		useWmStore.setState({
			windows: {},
			activeWindowId: null,
			nextZIndex: 100,
			nextWidgetZIndex: 20,
		});
	});

	it('focus and drag do not re-render the window list, slots or taskbar', () => {
		const { first, second } = openTwoWindows();

		const list = countRenders(selectVisibleWindowIds, shallow);
		const slot = countRenders((state) => selectContentWindow(state.windows[second]), shallow);
		const taskbar = countRenders(selectTaskbarSignature, Object.is);
		const otherActive = countRenders((state) => state.activeWindowId === second, Object.is);

		useWmStore.getState().focusWindow(first);
		useWmStore.getState().updateWindow(first, { x: 40, y: 60 });
		useWmStore.getState().updateWindow(second, { x: 10, y: 20 });

		expect(list.renders).toBe(0);
		expect(slot.renders).toBe(0);
		expect(taskbar.renders).toBe(0);
		// Only the windows whose active flag actually flipped re-render (second lost focus).
		expect(otherActive.renders).toBe(1);

		for (const counter of [list, slot, taskbar, otherActive]) {
			counter.unsubscribe();
		}
	});

	it('re-renders the taskbar and slot when rendered fields change', () => {
		const { second } = openTwoWindows();

		const slot = countRenders((state) => selectContentWindow(state.windows[second]), shallow);
		const taskbar = countRenders(selectTaskbarSignature, Object.is);
		const list = countRenders(selectVisibleWindowIds, shallow);

		useWmStore.getState().updateWindow(second, { title: 'Renamed' });
		useWmStore.getState().minimizeWindow(second);

		expect(slot.renders).toBe(1);
		expect(taskbar.renders).toBe(2);
		expect(list.renders).toBe(1);

		for (const counter of [list, slot, taskbar]) {
			counter.unsubscribe();
		}
	});
});
