import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock('@/core/api/client', () => ({
	apiClient: {
		get: (...args: unknown[]) => get(...args),
		put: (...args: unknown[]) => put(...args),
		delete: (...args: unknown[]) => del(...args),
	},
}));

import {
	deleteUserData,
	get as getUserData,
	list,
	upsert,
	userAppDataDtoSchema,
	userAppDataListResponseSchema,
	userDataApi,
	userDataEndpoints,
} from '@/core/api/endpoints/userData';

const sampleDto = {
	code: 'todo.ui.filters',
	value: { status: 'open' },
	createdAt: '2026-08-06T09:00:00+00:00',
	updatedAt: '2026-08-06T09:05:00+00:00',
};

describe('userData endpoints schemas', () => {
	it('parses DTO', () => {
		expect(userAppDataDtoSchema.parse(sampleDto)).toEqual(sampleDto);
	});

	it('parses list response', () => {
		const parsed = userAppDataListResponseSchema.parse({ items: [sampleDto] });
		expect(parsed.items).toHaveLength(1);
		expect(parsed.items[0]!.code).toBe('todo.ui.filters');
	});

	it('rejects missing timestamps', () => {
		expect(() =>
			userAppDataDtoSchema.parse({
				code: 'todo.x',
				value: 1,
			}),
		).toThrow();
	});
});

describe('userData endpoints helpers', () => {
	beforeEach(() => {
		get.mockReset();
		put.mockReset();
		del.mockReset();
	});

	it('list without prefix', async () => {
		get.mockResolvedValue({ data: { items: [sampleDto] } });

		const items = await list();

		expect(get).toHaveBeenCalledWith('/api/user-data', { params: undefined });
		expect(items).toEqual([sampleDto]);
	});

	it('list with prefix', async () => {
		get.mockResolvedValue({ data: { items: [] } });

		await list('todo.');

		expect(get).toHaveBeenCalledWith('/api/user-data', { params: { prefix: 'todo.' } });
	});

	it('get URL-encodes code', async () => {
		get.mockResolvedValue({ data: sampleDto });

		const dto = await getUserData('todo.ui.filters');

		expect(get).toHaveBeenCalledWith('/api/user-data/todo.ui.filters');
		expect(userDataEndpoints.one('a/b')).toBe('/api/user-data/a%2Fb');
		expect(dto).toEqual(sampleDto);
	});

	it('upsert sends PUT body', async () => {
		put.mockResolvedValue({ data: sampleDto });

		const dto = await upsert({ code: 'todo.ui.filters', value: { status: 'open' } });

		expect(put).toHaveBeenCalledWith('/api/user-data', {
			code: 'todo.ui.filters',
			value: { status: 'open' },
		});
		expect(dto).toEqual(sampleDto);
	});

	it('deleteUserData URL-encodes code', async () => {
		del.mockResolvedValue({ status: 204 });

		await deleteUserData('todo.ui.filters');

		expect(del).toHaveBeenCalledWith('/api/user-data/todo.ui.filters');
	});

	it('userDataApi.delete aliases deleteUserData', async () => {
		del.mockResolvedValue({ status: 204 });

		await userDataApi.delete('app.key');

		expect(del).toHaveBeenCalledWith('/api/user-data/app.key');
	});
});
