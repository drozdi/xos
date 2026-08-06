import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchExplorerList = vi.fn();

vi.mock('./explorerApi', () => ({
	fetchExplorerList: (...args: unknown[]) => fetchExplorerList(...args),
}));

import axios from 'axios';

import {
	EXPLORER_DEFAULT_PATH,
	clearExplorerLastPathLocalBuffer,
	isExplorerPathAccessible,
	loadStoredExplorerLastPath,
	parseExplorerLastPathValue,
	readExplorerLastPathLocalBuffer,
	resolveExplorerLastPath,
	toExplorerLastPathValue,
	upsertExplorerLastPath,
	writeExplorerLastPathLocalBuffer,
} from './explorerLastPath';

function axiosError(status?: number): Error {
	return new axios.AxiosError(
		'request failed',
		status ? String(status) : undefined,
		undefined,
		undefined,
		status
			? {
					status,
					statusText: 'Error',
					headers: {},
					config: {} as never,
					data: {},
				}
			: undefined,
	);
}

function installLocalStorage(): Record<string, string> {
	const store: Record<string, string> = {};
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	});
	return store;
}

function installDomStubs(): {
	visibilityState: string;
	dispatchEvent: (event: { type: string }) => boolean;
} {
	const handlers = new Map<string, Set<() => void>>();
	const target = {
		visibilityState: 'visible',
		addEventListener(type: string, fn: () => void) {
			if (!handlers.has(type)) {
				handlers.set(type, new Set());
			}
			handlers.get(type)!.add(fn);
		},
		removeEventListener(type: string, fn: () => void) {
			handlers.get(type)?.delete(fn);
		},
		dispatchEvent(event: { type: string }) {
			handlers.get(event.type)?.forEach((fn) => fn());
			return true;
		},
	};
	vi.stubGlobal('document', target);
	vi.stubGlobal('window', target);
	return target;
}

describe('explorerLastPath value shape', () => {
	it('parses { path } object', () => {
		expect(parseExplorerLastPathValue({ path: 'home://Docs' })).toBe('home://Docs/');
		expect(parseExplorerLastPathValue({ path: 'home://' })).toBe('home://');
	});

	it('rejects raw string and invalid shapes', () => {
		expect(parseExplorerLastPathValue('home://Docs')).toBeNull();
		expect(parseExplorerLastPathValue({ path: '' })).toBeNull();
		expect(parseExplorerLastPathValue({ path: 'Docs' })).toBeNull();
		expect(parseExplorerLastPathValue(null)).toBeNull();
	});

	it('toExplorerLastPathValue wraps path', () => {
		expect(toExplorerLastPathValue('home://Docs')).toEqual({ path: 'home://Docs/' });
	});
});

describe('loadStoredExplorerLastPath / resolveExplorerLastPath', () => {
	beforeEach(() => {
		installLocalStorage();
		fetchExplorerList.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('loads from local buffer', async () => {
		expect(await loadStoredExplorerLastPath()).toBeNull();

		writeExplorerLastPathLocalBuffer('home://Docs');
		await expect(loadStoredExplorerLastPath()).resolves.toBe('home://Docs/');
	});

	it('clears local buffer', () => {
		writeExplorerLastPathLocalBuffer('home://Work');
		clearExplorerLastPathLocalBuffer();
		expect(readExplorerLastPathLocalBuffer()).toBeNull();
	});

	it('resolve falls back to home:// when path inaccessible', async () => {
		writeExplorerLastPathLocalBuffer('home://Missing');
		fetchExplorerList.mockRejectedValue(axiosError(400));

		await expect(resolveExplorerLastPath()).resolves.toBe(EXPLORER_DEFAULT_PATH);
	});

	it('resolve keeps path when list succeeds', async () => {
		writeExplorerLastPathLocalBuffer('home://Docs');
		fetchExplorerList.mockResolvedValue({ path: 'home://Docs/', items: [] });

		await expect(resolveExplorerLastPath()).resolves.toBe('home://Docs/');
	});

	it('resolve keeps stored path on network error during probe', async () => {
		writeExplorerLastPathLocalBuffer('home://Docs');
		fetchExplorerList.mockRejectedValue(axiosError());

		await expect(resolveExplorerLastPath()).resolves.toBe('home://Docs/');
	});
});

describe('isExplorerPathAccessible', () => {
	beforeEach(() => {
		fetchExplorerList.mockReset();
	});

	it('returns false for non-uri', async () => {
		await expect(isExplorerPathAccessible('Docs')).resolves.toBe(false);
	});

	it('returns false on 403', async () => {
		fetchExplorerList.mockRejectedValue(axiosError(403));
		await expect(isExplorerPathAccessible('home://Secret')).resolves.toBe(false);
	});
});

describe('upsertExplorerLastPath', () => {
	beforeEach(() => {
		installLocalStorage();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes local buffer only', async () => {
		await upsertExplorerLastPath('home://Docs');

		expect(readExplorerLastPathLocalBuffer()).toBe('home://Docs/');
		await expect(upsertExplorerLastPath('home://Docs')).resolves.toBeUndefined();
		expect(readExplorerLastPathLocalBuffer()).toBe('home://Docs/');
	});
});
