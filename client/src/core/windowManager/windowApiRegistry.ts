import type { CloseEventHandler, WindowApi, WindowEventHandler } from './types';

interface WindowApiEntry {
	api: WindowApi;
	handlers: {
		closeHandlers: Set<CloseEventHandler>;
		focusHandlers: Set<WindowEventHandler>;
		resizeHandlers: Set<WindowEventHandler>;
	};
}

const registry = new Map<string, WindowApiEntry>();

export function registerWindowApi(
	windowId: string,
	api: WindowApi,
	handlers: WindowApiEntry['handlers'],
): void {
	registry.set(windowId, { api, handlers });
}

export function unregisterWindowApi(windowId: string): void {
	registry.delete(windowId);
}

export function getWindowApi(windowId: string): WindowApi | undefined {
	return registry.get(windowId)?.api;
}

export function emitWindowFocus(windowId: string): void {
	const entry = registry.get(windowId);
	if (!entry) {return;}
	for (const handler of entry.handlers.focusHandlers) {
		handler();
	}
}

export function emitWindowResize(windowId: string): void {
	const entry = registry.get(windowId);
	if (!entry) {return;}
	for (const handler of entry.handlers.resizeHandlers) {
		handler();
	}
}

export function emitWindowClose(windowId: string): void {
	const entry = registry.get(windowId);
	if (!entry) {return;}
	for (const handler of entry.handlers.closeHandlers) {
		void handler();
	}
}
