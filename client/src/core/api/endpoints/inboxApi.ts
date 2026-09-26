import { z } from 'zod';

import { apiClient } from '@/core/api/client';

const BASE = '/api/inbox/messages';

const userRefSchema = z.object({
	id: z.number().nullable().optional(),
	email: z.string().nullable().optional(),
	alias: z.string().nullable().optional(),
});

export const inboxMessageSummarySchema = z.object({
	id: z.number(),
	subject: z.string(),
	from: userRefSchema,
	to: userRefSchema,
	read_at: z.string().nullable().optional(),
	created_at: z.string().nullable().optional(),
	is_inbox: z.boolean().optional(),
	is_unread: z.boolean().optional(),
	body_md: z.string().optional(),
});

export type InboxMessage = z.infer<typeof inboxMessageSummarySchema>;

export const inboxApi = {
	list: async (box: 'inbox' | 'sent' = 'inbox'): Promise<InboxMessage[]> => {
		const { data } = await apiClient.get<{ items: unknown }>(BASE, { params: { box } });
		return z.array(inboxMessageSummarySchema).parse(data.items ?? []);
	},
	get: async (id: number): Promise<InboxMessage> => {
		const { data } = await apiClient.get<unknown>(`${BASE}/${id}`);
		return inboxMessageSummarySchema.parse(data);
	},
	create: async (payload: {
		to_email?: string;
		to_user_id?: number;
		subject: string;
		body_md: string;
	}): Promise<InboxMessage> => {
		const { data } = await apiClient.post<unknown>(BASE, payload);
		return inboxMessageSummarySchema.parse(data);
	},
	markRead: async (id: number): Promise<InboxMessage> => {
		const { data } = await apiClient.post<unknown>(`${BASE}/${id}/read`);
		return inboxMessageSummarySchema.parse(data);
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/${id}`);
	},
};
