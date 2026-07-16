import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type { ListRequest, PaginatedResponse, UserListItem } from '@/types/api.types';

export const mainEndpoints = {
	health: '/api/health',
	userList: '/api/main/user/list',
} as const;

export const userListItemSchema = z.object({
	id: z.number(),
	login: z.string().nullable().transform((value) => value ?? ''),
	alias: z.string().nullable().transform((value) => value ?? ''),
	ou: z.string().nullable().transform((value) => value ?? ''),
	tutor: z.string().nullable().transform((value) => value ?? ''),
});

export const userListResponseSchema = z.array(userListItemSchema);

export function parseContentRange(header: string | undefined): number {
	if (!header) {
		return 0;
	}
	const match = /items\s+\d+-\d+\/(\d+)/.exec(header);
	return match ? Number.parseInt(match[1]!, 10) : 0;
}

export async function listUsers(request: ListRequest = {}): Promise<PaginatedResponse<UserListItem>> {
	const payload = {
		t: 'list' as const,
		limit: 20,
		offset: 1,
		sortBy: [{ key: 'login', order: 'ASC' as const }],
		filters: {},
		...request,
	};

	const { data, headers } = await apiClient.post<unknown>(mainEndpoints.userList, payload);
	const items = userListResponseSchema.parse(data);
	const total = parseContentRange(headers['content-range'] as string | undefined);

	return {
		items,
		total: total || items.length,
		page: payload.offset,
		perPage: payload.limit,
	};
}
