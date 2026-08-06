import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/core/theme/types';
import { xosColorSchemeManager } from '@/core/theme/xosColorSchemeManager';

function createStorage(): Storage {
	const store = new Map<string, string>();

	return {
		get length() {
			return store.size;
		},
		clear: () => store.clear(),
		getItem: (key) => store.get(key) ?? null,
		key: (index) => [...store.keys()][index] ?? null,
		removeItem: (key) => {
			store.delete(key);
		},
		setItem: (key, value) => {
			store.set(key, value);
		},
	};
}

describe('xosColorSchemeManager', () => {
	beforeEach(() => {
		const storage = createStorage();
		vi.stubGlobal('localStorage', storage);
		vi.stubGlobal('window', { localStorage: storage });
	});

	it('reads theme from xos settings storage', () => {
		localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('light'));

		const manager = xosColorSchemeManager();
		expect(manager.get(DEFAULT_THEME)).toBe('light');
	});

	it('persists theme as JSON', () => {
		const manager = xosColorSchemeManager();
		manager.set('auto');

		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(JSON.stringify('auto'));
	});

	it('set is no-op when value already matches storage', () => {
		localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('light'));
		const setItem = vi.spyOn(localStorage, 'setItem');

		const manager = xosColorSchemeManager();
		manager.set('light');

		expect(setItem).not.toHaveBeenCalled();
	});
});
