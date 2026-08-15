import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import {
	createEntity,
	getDetail,
	postList,
	removeEntity,
	updateEntity,
} from '@/core/api/crudHelpers';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

function normalizeIdRecord(
	value: unknown,
	fallbackKey: (item: Record<string, unknown>, index: number) => string | number,
): Record<string, unknown> {
	if (value === null || value === undefined) {
		return {};
	}
	if (Array.isArray(value)) {
		const record: Record<string, unknown> = {};
		value.forEach((item, index) => {
			if (typeof item !== 'object' || item === null) {
				return;
			}
			const entry = item as Record<string, unknown>;
			const key = entry.id ?? fallbackKey(entry, index);
			record[String(key)] = item;
		});
		return record;
	}
	if (typeof value === 'object') {
		return value as Record<string, unknown>;
	}
	return {};
}

export const groupAccessItemSchema = z.object({
	id: z.number().optional(),
	claimant_id: z.number(),
	name: z.string().optional(),
	level: z.number(),
});

export const userGroupItemSchema = z.object({
	id: z.number().optional(),
	group_id: z.number(),
	user_id: z.number().optional(),
	name: z.string().optional(),
	activeFrom: z.string().nullable().optional(),
	activeTo: z.string().nullable().optional(),
});

const userGroupsRecordSchema = z.preprocess(
	(value) =>
		normalizeIdRecord(value, (item, index) => {
			const groupId = item.group_id;
			return typeof groupId === 'number' || typeof groupId === 'string' ? groupId : index;
		}),
	z.record(z.string(), userGroupItemSchema),
).optional();

const userAccessesRecordSchema = z.preprocess(
	(value) =>
		normalizeIdRecord(value, (item, index) => {
			const claimantId = item.claimant_id;
			return typeof claimantId === 'number' || typeof claimantId === 'string' ? claimantId : index;
		}),
	z.record(z.string(), groupAccessItemSchema),
).optional();

// --- Users ---

export const userListItemSchema = z.object({
	id: z.number(),
	login: z.string().nullable().transform((value) => value ?? ''),
	alias: z.string().nullable().transform((value) => value ?? ''),
	ou: z.string().nullable().transform((value) => value ?? ''),
	tutor: z.string().nullable().transform((value) => value ?? ''),
});

export const userFilterGroupSchema = z.union([
	z.object({
		type: z.literal('divider'),
	}),
	z.object({
		type: z.string().optional(),
		key: z.union([z.number(), z.string()]).optional(),
		value: z.union([z.number(), z.string()]),
		title: z.string(),
	}),
]);

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
		activeFrom: z.string().nullable().optional(),
		activeTo: z.string().nullable().optional(),
		last_login: z.string().nullable().optional(),
		password: z.string().optional(),
		confirm_password: z.string().optional(),
		roles: z.array(z.string()).optional(),
		groups: userGroupsRecordSchema,
		accesses: userAccessesRecordSchema,
	})
	.passthrough();

export const userSelectItemSchema = z.object({
	value: z.number(),
	label: z.string(),
});

export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserFilterOu = z.infer<typeof userFilterOuSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
export type UserGroupItem = z.infer<typeof userGroupItemSchema>;
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
	roleOptions: async () => {
		const { data } = await apiClient.get<unknown>('/api/main/user/role-options');
		return z.array(z.string()).parse(data);
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

export const groupUserItemSchema = z.object({
	id: z.number().optional(),
	user_id: z.number(),
	group_id: z.number().optional(),
	name: z.string().optional(),
	activeFrom: z.string().nullable().optional(),
	activeTo: z.string().nullable().optional(),
});

const groupUsersRecordSchema = z.preprocess(
	(value) =>
		normalizeIdRecord(value, (item, index) => {
			const userId = item.user_id;
			return typeof userId === 'number' || typeof userId === 'string' ? userId : index;
		}),
	z.record(z.string(), groupUserItemSchema),
).optional();

const groupAccessesRecordSchema = z.preprocess(
	(value) =>
		normalizeIdRecord(value, (item, index) => {
			const claimantId = item.claimant_id;
			return typeof claimantId === 'number' || typeof claimantId === 'string' ? claimantId : index;
		}),
	z.record(z.string(), groupAccessItemSchema),
).optional();

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
		users: groupUsersRecordSchema,
		accesses: groupAccessesRecordSchema,
	})
	.passthrough();

export type GroupUserItem = z.infer<typeof groupUserItemSchema>;
export type GroupAccessItem = z.infer<typeof groupAccessItemSchema>;

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

export const ouSelectItemSchema = z.object({
	value: z.number(),
	label: z.string(),
});

export type OuSelectItem = z.infer<typeof ouSelectItemSchema>;

export const mainOuApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/ou/list', request ?? {}, z.array(ouListItemSchema)),
	select: (request?: ListRequest) =>
		postList(
			'/api/main/ou/select',
			{
				limit: -1,
				offset: 1,
				sortBy: [
					{ key: 'sort', order: 'ASC' },
					{ key: 'name', order: 'ASC' },
				],
				...request,
			},
			z.array(ouSelectItemSchema),
		),
	get: (id: number) => getDetail(`/api/main/ou/${id}`, ouDetailSchema),
	create: (body: unknown) => createEntity('/api/main/ou/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/ou', id, body),
	remove: (id: number) => removeEntity('/api/main/ou', id),
};

// --- Claimants ---

export const accessOptionSchema = z.object({
	bit: z.number().positive(),
	title: z.string(),
	description: z.string().optional(),
});

export const accessOptionsSchema = z.preprocess(
	(value) => (Array.isArray(value) || value == null ? {} : value),
	z.record(z.string(), accessOptionSchema),
);

export const claimantListItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	code: z.string(),
	access_options: accessOptionsSchema.default({}),
});

export const claimantDetailSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional(),
	code: z.string().nullable().optional(),
	access_options: accessOptionsSchema.default({}),
});

export type AccessOption = z.infer<typeof accessOptionSchema>;
export type AccessOptions = z.infer<typeof accessOptionsSchema>;
export type ClaimantListItem = z.infer<typeof claimantListItemSchema>;
export type ClaimantDetail = z.infer<typeof claimantDetailSchema>;

export const appAccessModuleSchema = z.object({
	module: z.string(),
	moduleLabel: z.string(),
	root: claimantListItemSchema.optional(),
	children: z.array(claimantListItemSchema),
});

export type AppAccessModule = z.infer<typeof appAccessModuleSchema>;

export const mainClaimantApi = {
	list: (request?: ListRequest) =>
		postList('/api/main/claimant/list', request ?? {}, z.array(claimantListItemSchema)),
	appAccessModules: async () => {
		const { data } = await apiClient.get<unknown>('/api/main/claimant/app-access-modules');
		return z.array(appAccessModuleSchema).parse(data);
	},
	get: (id: number) => getDetail(`/api/main/claimant/${id}`, claimantDetailSchema),
	create: (body: unknown) => createEntity('/api/main/claimant/', body),
	update: (id: number, body: unknown) => updateEntity('/api/main/claimant', id, body),
	remove: (id: number) => removeEntity('/api/main/claimant', id),
};
