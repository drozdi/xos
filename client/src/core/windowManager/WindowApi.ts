import type {
	CloseEventHandler,
	ChildWindowHandle,
	ChildWindowOptions,
	WindowApi,
	WindowEvent,
	WindowEventHandler,
} from './types';
import type { WindowDragConfig } from './windowDrag';
import { fitWindowToContent } from './useWindowAutoSize';
import type { WindowAutoSizeMode } from './windowLayout';
import { useChildWindowStore } from './childWindowStore';
import { useWmStore } from './useWmStore';
import { getWindowApi, registerWindowApi, unregisterWindowApi } from './windowApiRegistry';
import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { AppRegistry } from '@/core/appManager/AppRegistry';

const DEFAULT_CHILD_WIDTH = 400;
const DEFAULT_CHILD_HEIGHT = 300;

export function getOrCreateWindowApi(windowId: string): WindowApi {
	return getWindowApi(windowId) ?? createWindowApi(windowId);
}

export function createWindowApi(windowId: string): WindowApi {
	const closeHandlers = new Set<CloseEventHandler>();
	const focusHandlers = new Set<WindowEventHandler>();
	const resizeHandlers = new Set<WindowEventHandler>();

	const api: WindowApi = {
		close: async (force = false) => {
			if (!force) {
				for (const handler of closeHandlers) {
					const result = await handler();
					if (result === false) {return false;}
				}
			}

			useWmStore.getState().closeWindow(windowId);
			return true;
		},

		minimize: () => {
			useWmStore.getState().minimizeWindow(windowId);
		},

		maximize: () => {
			useWmStore.getState().maximizeWindow(windowId, getDesktopBounds());
		},

		restore: () => {
			useWmStore.getState().restoreWindow(windowId);
		},

		refresh: () => {
			const current = useWmStore.getState().windows[windowId];
			if (!current) {return;}
			useWmStore.getState().updateWindow(windowId, {
				contentKey: current.contentKey + 1,
			});
		},

		setTitle: (title: string) => {
			const current = useWmStore.getState().windows[windowId]?.title;
			if (current === title) {
				return;
			}
			useWmStore.getState().updateWindow(windowId, { title });
		},

		setSize: (width: number, height: number) => {
			useWmStore.getState().updateWindow(windowId, { width, height });
			for (const handler of resizeHandlers) {handler();}
		},

		setPosition: (x: number, y: number) => {
			useWmStore.getState().updateWindow(windowId, { x, y });
			for (const handler of resizeHandlers) {handler();}
		},

		setDragOptions: (options: WindowDragConfig) => {
			const current = useWmStore.getState().windows[windowId];
			if (!current) {
				return;
			}
			useWmStore.getState().updateWindow(windowId, {
				dragHandles: options.dragHandles ?? current.dragHandles,
				dragCancel: options.dragCancel ?? current.dragCancel,
			});
		},

		setResizable: (resizable: boolean) => {
			useWmStore.getState().updateWindow(windowId, { resizable });
		},

		setPositionFixed: (fixed: boolean) => {
			useWmStore.getState().updateWindow(windowId, { positionFixed: fixed });
		},

		setAutoSize: (mode: WindowAutoSizeMode) => {
			useWmStore.getState().updateWindow(windowId, { autoSize: mode });
		},

		fitToContent: () => {
			const current = useWmStore.getState().windows[windowId];
			if (!current) {
				return;
			}

			const contentRoot = document.querySelector(
				`[data-xos-window-id="${windowId}"] [data-xos-window-content]`,
			) as HTMLElement | null;
			if (!contentRoot) {
				return;
			}

			const manifest = AppRegistry.get(current.appId);
			const { minWidth, minHeight } = HKEY_CONFIG_DEFAULTS.window;

			fitWindowToContent(windowId, contentRoot, 36, {
				minWidth: manifest?.minSize?.width ?? minWidth,
				minHeight: manifest?.minSize?.height ?? minHeight,
				maxWidth: window.innerWidth,
				maxHeight: window.innerHeight,
			});
			for (const handler of resizeHandlers) {
				handler();
			}
		},

		on: ((event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => {
			const handlers = getHandlers(event, closeHandlers, focusHandlers, resizeHandlers);
			handlers.add(handler);
			return () => {
				handlers.delete(handler);
			};
		}) as WindowApi['on'],

		off: (event: WindowEvent, handler: CloseEventHandler | WindowEventHandler) => {
			getHandlers(event, closeHandlers, focusHandlers, resizeHandlers).delete(handler);
		},

		createChildWindow: (options: ChildWindowOptions): ChildWindowHandle => {
			const id = `child-${windowId}-${crypto.randomUUID()}`;
			useChildWindowStore.getState().addChild(windowId, {
				id,
				title: options.title ?? '',
				width: options.width ?? DEFAULT_CHILD_WIDTH,
				height: options.height ?? DEFAULT_CHILD_HEIGHT,
				content: options.content ?? null,
				open: true,
			});
			return {
				id,
				close: () => {
					useChildWindowStore.getState().removeChild(windowId, id);
				},
			};
		},
	};

	registerWindowApi(windowId, api, { closeHandlers, focusHandlers, resizeHandlers });
	return api;
}

export function destroyWindowApi(windowId: string): void {
	useChildWindowStore.getState().clearParent(windowId);
	unregisterWindowApi(windowId);
}

function getHandlers(
	event: WindowEvent,
	closeHandlers: Set<CloseEventHandler>,
	focusHandlers: Set<WindowEventHandler>,
	resizeHandlers: Set<WindowEventHandler>,
): Set<CloseEventHandler | WindowEventHandler> {
	switch (event) {
		case 'close':
			return closeHandlers;
		case 'focus':
			return focusHandlers;
		case 'resize':
			return resizeHandlers;
	}
}

function getDesktopBounds(): { x: number; y: number; width: number; height: number } {
	const taskbarHeight = HKEY_CONFIG_DEFAULTS.taskbar.height;
	return {
		x: 0,
		y: 0,
		width: window.innerWidth,
		height: Math.max(0, window.innerHeight - taskbarHeight),
	};
}
