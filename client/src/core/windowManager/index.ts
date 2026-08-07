export { useWmStore } from './useWmStore';
export { Window } from './Window';
export { WindowManager } from './WindowManager';
export { createWindowApi, destroyWindowApi, getOrCreateWindowApi } from './WindowApi';
export { ChildWindowPortal } from './ChildWindowPortal';
export { WindowErrorBoundary } from './WindowErrorBoundary';
export { useWindowSize, useObserveWindowSize, WindowSizeContext } from './useWindowSize';
export { schedulePersistWindow, persistWindowNow, removePersistedWindow, flushPendingWindowPersists, persistAllOpenWindowsNow, setWindowDocumentPath } from './persistWindow';
/** @deprecated Dead path — канон = restoreFromHistory (ADR-desktop-ux-sync). */
export { restoreWindows } from './restoreWindows';
export { DemoWindowContent } from './DemoWindowContent';
export {
	XOS_WINDOW_TITLEBAR_CLASS,
	XOS_WINDOW_DRAG_HANDLE_CLASS,
	XOS_WINDOW_NO_DRAG_CLASS,
	resolveWindowDragConfig,
	buildDragCancelSelector,
} from './windowDrag';
export type { WindowDragConfig, ResolvedWindowDragConfig } from './windowDrag';
export type {
	WindowState,
	OpenWindowPayload,
	PersistedWindowState,
	WindowApi,
	WindowEvent,
	ChildWindowOptions,
	ChildWindowHandle,
} from './types';
export type {
	WindowLayoutConfig,
	WindowAutoSizeMode,
	WindowPositionFixed,
	ResolvedWindowLayoutConfig,
	WindowLayoutBounds,
} from './windowLayout';
export {
	resolveWindowLayoutConfig,
	resolveInitialWindowPosition,
	clampWindowSize,
} from './windowLayout';
export { useWindowAutoSize, fitWindowToContent } from './useWindowAutoSize';
