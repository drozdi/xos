import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

import { parseContentRange } from './endpoints/main';

export const listRequestDefaults: ListRequest = {
	t: 'list',
	limit: -1,
	offset: 1,
	filters: {},
};

export async function postList<T>(
	path: string,
	request: ListRequest,
	schema: z.ZodType<T[]>,
): Promise<PaginatedResponse<T>> {
	const payload = { ...listRequestDefaults, ...request };
	const { data, headers } = await apiClient.post<unknown>(path, payload);
	const items = schema.parse(data);
	const total = parseContentRange(headers['content-range'] as string | undefined);

	return {
		items,
		total: total || items.length,
		page: payload.offset ?? 1,
		perPage: payload.limit ?? 50,
	};
}

export async function getDetail<T>(path: string, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.get<unknown>(path);
	return schema.parse(data);
}

export async function createEntity(path: string, body: unknown): Promise<number> {
	const { data } = await apiClient.post<number>(path, body);
	return typeof data === 'number' ? data : Number(data);
}

export async function updateEntity(path: string, id: number, body: unknown): Promise<number> {
	const { data } = await apiClient.put<number>(`${path}/${id}`, body);
	return typeof data === 'number' ? data : Number(data);
}

export async function removeEntity(path: string, id: number): Promise<void> {
	await apiClient.delete(`${path}/${id}`);
}
