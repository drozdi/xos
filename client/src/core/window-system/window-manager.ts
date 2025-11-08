import { useWmStore } from './store';

// zIndex: 100,
// 	current: undefined,
// 	stack: {},
// 	stacks: {},
// 	setZIndex(zIndex)
// 	active(win)
// 	disable()
// 	isActive(win)
// 	add(win)
// 	del(win)
export const windowManager = {
	setZIndex: useWmStore.getState().setZIndex,
	/*open: useWindowManager.getState().openWindow,
	close: useWindowManager.getState().closeWindow,
	minimize: useWindowManager.getState().minimizeWindow,
	maximize: useWindowManager.getState().maximizeWindow,
	focus: useWindowManager.getState().focusWindow,
	update: useWindowManager.getState().updateWindow,
	getState: useWindowManager.getState().getWindowState,*/
};
