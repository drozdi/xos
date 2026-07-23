import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import { getDetail } from '@/core/api/crudHelpers';

const BASE = '/api/todo';

const ownerSchema = z.object({
	id: z.number().nullable().optional(),
	alias: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
});

const itemSchema = z.object({
	id: z.number().nullable().optional(),
	text: z.string(),
	done: z.boolean(),
	due_at: z.string().nullable().optional(),
	position: z.number().optional(),
});

const shareSchema = z.object({
	user_id: z.number().nullable().optional(),
	alias: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	permission: z.enum(['read', 'write']),
});

export const todoListSummarySchema = z.object({
	id: z.number(),
	title: z.string(),
	color: z.string(),
	is_owner: z.boolean(),
	can_write: z.boolean(),
	owner: ownerSchema.optional(),
	items_count: z.number().optional(),
	items_preview: z.array(itemSchema).optional().default([]),
	updated_at: z.string().nullable().optional(),
});

export const todoListDetailSchema = z.object({
	id: z.number(),
	title: z.string(),
	color: z.string(),
	notes_md: z.string().nullable().optional(),
	markdown: z.string(),
	is_owner: z.boolean(),
	can_write: z.boolean(),
	owner: ownerSchema.optional(),
	items: z.array(itemSchema).default([]),
	shares: z.array(shareSchema).default([]),
	created_at: z.string().nullable().optional(),
	updated_at: z.string().nullable().optional(),
});

export const todoUserSchema = z.object({
	id: z.number(),
	email: z.string().nullable().optional(),
	alias: z.string().nullable().optional(),
	login: z.string().nullable().optional(),
});

export type TodoListSummary = z.infer<typeof todoListSummarySchema>;
export type TodoListDetail = z.infer<typeof todoListDetailSchema>;
export type TodoItem = z.infer<typeof itemSchema>;
export type TodoShare = z.infer<typeof shareSchema>;

export type TodoListWritePayload = {
	title?: string;
	color?: string;
	markdown?: string;
	notes_md?: string | null;
	items?: Array<{
		text: string;
		done?: boolean;
		due_at?: string | null;
		position?: number;
	}>;
};

async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.post<unknown>(path, body);
	return schema.parse(data);
}

async function putJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.put<unknown>(path, body);
	return schema.parse(data);
}

export const todoApi = {
	lists: async (): Promise<TodoListSummary[]> => {
		const { data } = await apiClient.get<unknown>(`${BASE}/lists`);
		return z.array(todoListSummarySchema).parse(data);
	},
	detail: (id: number) => getDetail(`${BASE}/lists/${id}`, todoListDetailSchema),
	create: (payload: TodoListWritePayload) =>
		postJson(`${BASE}/lists`, payload, todoListDetailSchema),
	update: (id: number, payload: TodoListWritePayload) =>
		putJson(`${BASE}/lists/${id}`, payload, todoListDetailSchema),
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/lists/${id}`);
	},
	share: (id: number, email: string, permission: 'read' | 'write') =>
		postJson(`${BASE}/lists/${id}/share`, { email, permission }, todoListDetailSchema),
	unshare: async (id: number, userId: number): Promise<TodoListDetail> => {
		const { data } = await apiClient.delete<unknown>(`${BASE}/lists/${id}/share/${userId}`);
		return todoListDetailSchema.parse(data);
	},
	findUserByEmail: (email: string) =>
		getDetail(`${BASE}/users/by-email?email=${encodeURIComponent(email)}`, todoUserSchema),
};
