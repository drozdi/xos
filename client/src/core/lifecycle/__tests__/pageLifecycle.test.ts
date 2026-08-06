import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	attachPageLifecycleListeners,
	detachPageLifecycleListeners,
	isPageUnloading,
	registerUnloadFlush,
	resetPageLifecycleForTests,
} from '../pageLifecycle';

function installWindowStub(): {
	dispatchEvent: (type: string) => void;
} {
	const handlers = new Map<string, Set<() => void>>();
	const target = {
		addEventListener(type: string, fn: () => void) {
			if (!handlers.has(type)) {
				handlers.set(type, new Set());
			}
			handlers.get(type)!.add(fn);
		},
		removeEventListener(type: string, fn: () => void) {
			handlers.get(type)?.delete(fn);
		},
		dispatchEvent(type: string) {
			handlers.get(type)?.forEach((fn) => fn());
		},
	};
	vi.stubGlobal('window', target);
	return target;
}

describe('pageLifecycle', () => {
	afterEach(() => {
		resetPageLifecycleForTests();
		vi.unstubAllGlobals();
	});

	it('marks unloading on pagehide and clears on pageshow', () => {
		const win = installWindowStub();
		attachPageLifecycleListeners();
		expect(isPageUnloading()).toBe(false);

		win.dispatchEvent('pagehide');
		expect(isPageUnloading()).toBe(true);

		win.dispatchEvent('pageshow');
		expect(isPageUnloading()).toBe(false);
	});

	it('marks unloading on beforeunload', () => {
		const win = installWindowStub();
		attachPageLifecycleListeners();
		win.dispatchEvent('beforeunload');
		expect(isPageUnloading()).toBe(true);
	});

	it('detach removes listeners', () => {
		const win = installWindowStub();
		attachPageLifecycleListeners();
		detachPageLifecycleListeners();
		win.dispatchEvent('pagehide');
		expect(isPageUnloading()).toBe(false);
	});

	it('runs registered unload flush handlers on pagehide', () => {
		const win = installWindowStub();
		const flush = vi.fn();
		registerUnloadFlush(flush);
		win.dispatchEvent('pagehide');
		expect(flush).toHaveBeenCalledTimes(1);
		expect(isPageUnloading()).toBe(true);
	});
});
