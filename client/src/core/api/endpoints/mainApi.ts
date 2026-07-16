import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

import { parseContentRange } from './main';

const listRequestDefaults: ListRequest = {
	t: 'list',
	limit: -1,
	offset: 1,
	filters: {},
};

async function postList<T>(
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

async function getDetail<T>(path: string, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.get<unknown>(path);
	return schema.parse(data);
}

async function createEntity(path: string, body: unknown): Promise<number> {
	const { data } = await apiClient.post<number>(path, body);
	return typeof data === 'number' ? data : Number(data);
}

async function updateEntity(path: string, id: number, body: unknown): Promise<number> {
	const { data } = await apiClient.put<number>(`${path}/${id}`, body);
	return typeof data === 'number' ? data : Number(data);
}

async function removeEntity(path: string, id: number): Promise<void> {
	await apiClient.delete(`${path}/${id}`);
}

// --- Users ---

export const userListItemSchema = z.object({
	id: z.number(),
	login: z.string().nullable().transform((value) => value ?? ''),
	alias: z.string().nullable().transform((value) => value ?? ''),
	ou: z.string().nullable().transform((value) => value ?? ''),
	tutor: z.string().nullable().transform((value) => value ?? ''),
});

export const userFilterGroupSchema = z.object({
	type: z.string().optional(),
	key: z.union([z.number(), z.string()]).optional(),
	value: z.union([z.number(), z.string()]),
	title: z.string(),
});

export const userFilterOuSchema = z.object({
	value: z.number(),
	title: z.string(),
	groups: z.array(userFilterGroupSchema).optional(),
});

export const userDetailSchema = z
	.object({
		id: z.number(),
		login: z.string().nullable().optional(),
		alias: z.string().nullable().optional(),
		email: z.string().nullable().optional(),
		first_name: z.string().nullable().optional(),
		second_name: z.string().nullable().optional(),
		patronymic: z.string().nullable().optional(),
		active: z.boolean().optional(),
		ou_id: z.number().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		phone: z.string().nullable().optional(),
		description: z.string().nullable().optional(),
		gender: z.string().nullable().optional(),
		country: z.string().nullable().optional(),
		roles: z.array(z.string()).optional(),
	})
	.passthrough();

export const userSelectItemSchema = z.object({
	value: z.number(),
	label: z.string(),
});

export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserFilterOu = z.infer<typeof userFilterOuSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
export type UserSelectItem = z.infer<typeof userSelectItemSchema>;

export const mainUserApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/user/list', request ?? {}, z.array(userListItemSchema)),
	select: (request?: ListRequest) =>
		postList(
			'/api/main/user/select',
			{
				limit: -1,
				offset: 1,
				sortBy: [{ key: 'login', order: 'ASC' }],
				...request,
			},
			z.array(userSelectItemSchema),
		),
	filter: async () => {
		const { data } = await apiClient.get<unknown>('/api/main/user/filter');
		return z.array(userFilterOuSchema).parse(data);
	},
	get: (id: number) => getDetail(`/api/main/user/${id}`, userDetailSchema),
	create: (body: unknown) => createEntity('/api/main/user/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/user', id, body),
	remove: (id: number) => removeEntity('/api/main/user', id),
};

// --- Groups ---

export const groupListItemSchema = z.object({
	id: z.number(),
	code: z.string(),
	name: z.string(),
	sort: z.number(),
	ou: z.string(),
	tutor: z.string(),
});

export const groupFilterOuSchema = z.object({
	id: z.number(),
	code: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
});

export const groupDetailSchema = z
	.object({
		id: z.number(),
		code: z.string().nullable().optional(),
		name: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		ou_id: z.number().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		user_id: z.number().nullable().optional(),
		active: z.boolean().optional(),
		anonymous: z.boolean().optional(),
		description: z.string().nullable().optional(),
		activeFrom: z.string().nullable().optional(),
		activeTo: z.string().nullable().optional(),
	})
	.passthrough();

export type GroupListItem = z.infer<typeof groupListItemSchema>;
export type GroupDetail = z.infer<typeof groupDetailSchema>;

export const mainGroupApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/group/list', request ?? {}, z.array(groupListItemSchema)),
	filter: async () => {
		const { data } = await apiClient.get<unknown>('/api/main/group/filter');
		return z.array(groupFilterOuSchema).parse(data);
	},
	get: (id: number) => getDetail(`/api/main/group/${id}`, groupDetailSchema),
	create: (body: unknown) => createEntity('/api/main/group/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/group', id, body),
	remove: (id: number) => removeEntity('/api/main/group', id),
};

// --- OU ---

export const ouListItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	code: z.string(),
	description: z.string().nullable().optional(),
	sort: z.number(),
	is_tutors: z.number(),
	user_id: z.number(),
	tutor: z.string(),
});

export const ouDetailSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional(),
	code: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	sort: z.number().nullable().optional(),
	is_tutors: z.boolean().optional(),
	user_id: z.number().nullable().optional(),
	x_timestamp: z.union([z.string(), z.number()]).nullable().optional(),
});

export type OuListItem = z.infer<typeof ouListItemSchema>;
export type OuDetail = z.infer<typeof ouDetailSchema>;

export const mainOuApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/ou/list', request ?? {}, z.array(ouListItemSchema)),
	get: (id: number) => getDetail(`/api/main/ou/${id}`, ouDetailSchema),
	create: (body: unknown) => createEntity('/api/main/ou/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/ou', id, body),
	remove: (id: number) => removeEntity('/api/main/ou', id),
};

// --- Claimants ---

export const claimantListItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	code: z.string(),
});

export const claimantDetailSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional(),
	code: z.string().nullable().optional(),
});

export type ClaimantListItem = z.infer<typeof claimantListItemSchema>;
export type ClaimantDetail = z.infer<typeof claimantDetailSchema>;

export const mainClaimantApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/claimant/list', request ?? {}, z.array(claimantListItemSchema)),
	get: (id: number) => getDetail(`/api/main/claimant/${id}`, claimantDetailSchema),
	create: (body: unknown) => createEntity('/api/main/claimant/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/claimant', id, body),
	remove: (id: number) => removeEntity('/api/main/claimant', id),
};
