/**
 * Page teardown detection for desktop UX sync.
 * On tab close/refresh, WM unmount must not wipe APP.launchHistory / WIN on the server.
 */

let unloading = false;
let listenersAttached = false;
const unloadFlushHandlers = new Set<() => void | Promise<void>>();

function runUnloadFlushHandlers(): void {
	for (const handler of unloadFlushHandlers) {
		try {
			void handler();
		} catch {
			// best-effort on teardown
		}
	}
}

function onPageHide(): void {
	unloading = true;
	runUnloadFlushHandlers();
}

function onPageShow(): void {
	unloading = false;
}

export function isPageUnloading(): boolean {
	return unloading;
}

/** Register best-effort flush (WIN timers, explorer path, …) on tab hide/unload. */
export function registerUnloadFlush(handler: () => void | Promise<void>): () => void {
	unloadFlushHandlers.add(handler);
	attachPageLifecycleListeners();
	return () => {
		unloadFlushHandlers.delete(handler);
	};
}

/** Test helper */
export function resetPageLifecycleForTests(): void {
	unloading = false;
	unloadFlushHandlers.clear();
	detachPageLifecycleListeners();
}

export function attachPageLifecycleListeners(): void {
	if (listenersAttached || typeof window === 'undefined') {
		return;
	}
	window.addEventListener('pagehide', onPageHide);
	window.addEventListener('beforeunload', onPageHide);
	window.addEventListener('pageshow', onPageShow);
	listenersAttached = true;
}

export function detachPageLifecycleListeners(): void {
	if (!listenersAttached || typeof window === 'undefined') {
		return;
	}
	window.removeEventListener('pagehide', onPageHide);
	window.removeEventListener('beforeunload', onPageHide);
	window.removeEventListener('pageshow', onPageShow);
	listenersAttached = false;
}
