import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const put = vi.fn();

vi.mock('@/core/api/client', () => ({
	apiClient: {
		get: (...args: unknown[]) => get(...args),
		put: (...args: unknown[]) => put(...args),
	},
}));

import {
	desktopStateApi,
	desktopStateSnapshotSchema,
} from '@/core/api/endpoints/desktopState';

const snapshot = {
	settings: [
		{
			category: 'USER',
			key: 'theme',
			value: 'dark',
			updatedAt: '2026-08-06T09:00:00+00:00',
		},
		{
			category: 'APP',
			key: 'launchHistory',
			value: [],
			updatedAt: '2026-08-06T09:00:00+00:00',
		},
	],
	explorerLastPath: {
		path: 'home://Docs/',
		updatedAt: '2026-08-06T09:00:00+00:00',
	},
} as const;

describe('desktopState schema', () => {
	it('parses snapshot DTO', () => {
		expect(desktopStateSnapshotSchema.parse(snapshot)).toEqual(snapshot);
	});

	it('allows empty snapshot', () => {
		expect(
			desktopStateSnapshotSchema.parse({
				settings: [],
				explorerLastPath: null,
			}),
		).toEqual({
			settings: [],
			explorerLastPath: null,
		});
	});
});

describe('desktopStateApi', () => {
	beforeEach(() => {
		get.mockReset();
		put.mockReset();
	});

	it('loads desktop state via GET', async () => {
		get.mockResolvedValue({ data: snapshot });

		await expect(desktopStateApi.load()).resolves.toEqual(snapshot);
		expect(get).toHaveBeenCalledWith('/api/desktop-state');
	});

	it('saves desktop state via PUT', async () => {
		put.mockResolvedValue({ data: snapshot });

		await expect(desktopStateApi.save(snapshot)).resolves.toEqual(snapshot);
		expect(put).toHaveBeenCalledWith('/api/desktop-state', snapshot);
	});
});
