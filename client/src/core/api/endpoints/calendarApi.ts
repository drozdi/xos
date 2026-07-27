import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import { getDetail } from '@/core/api/crudHelpers';

const BASE = '/api/calendar';

const ownerSchema = z.object({
	id: z.number().nullable().optional(),
	alias: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
});

const shareSchema = z.object({
	user_id: z.number().nullable().optional(),
	alias: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	permission: z.enum(['read', 'write']),
});

const groupShareSchema = z.object({
	group_id: z.number().nullable().optional(),
	code: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	permission: z.enum(['read', 'write']),
});

export const calendarSchema = z.object({
	id: z.number(),
	title: z.string(),
	color: z.string(),
	type: z.enum(['master', 'slave']).default('slave'),
	is_owner: z.boolean(),
	can_write: z.boolean(),
	can_delete: z.boolean().optional().default(false),
	via_group: z.boolean().optional().default(false),
	owner: ownerSchema.optional(),
	shares: z.array(shareSchema).default([]),
	group_shares: z.array(groupShareSchema).default([]),
	created_at: z.string().nullable().optional(),
	updated_at: z.string().nullable().optional(),
});

export const calendarEventSchema = z.object({
	id: z.number(),
	calendar_id: z.number().nullable().optional(),
	title: z.string(),
	description: z.string().nullable().optional(),
	start_at: z.string(),
	end_at: z.string(),
	all_day: z.boolean(),
	color: z.string().nullable().optional(),
});

export const calendarUserSchema = z.object({
	id: z.number(),
	email: z.string().nullable().optional(),
	alias: z.string().nullable().optional(),
	login: z.string().nullable().optional(),
});

export const calendarGroupSchema = z.object({
	id: z.number(),
	code: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
});

export type CalendarDto = z.infer<typeof calendarSchema>;
export type CalendarEventDto = z.infer<typeof calendarEventSchema>;
export type CalendarShare = z.infer<typeof shareSchema>;
export type CalendarGroupShare = z.infer<typeof groupShareSchema>;
export type CalendarUser = z.infer<typeof calendarUserSchema>;
export type CalendarGroup = z.infer<typeof calendarGroupSchema>;

export type CalendarWritePayload = {
	title?: string;
	color?: string;
};

export type CalendarEventWritePayload = {
	calendar_id?: number;
	title?: string;
	description?: string | null;
	start_at?: string;
	end_at?: string;
	all_day?: boolean;
};

export type CalendarEventsQuery = {
	start: string;
	end: string;
	calendar_ids?: number[];
};

async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.post<unknown>(path, body);
	return schema.parse(data);
}

async function putJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.put<unknown>(path, body);
	return schema.parse(data);
}

export const calendarApi = {
	calendars: async (): Promise<CalendarDto[]> => {
		const { data } = await apiClient.get<unknown>(`${BASE}/calendars`);
		return z.array(calendarSchema).parse(data);
	},
	createCalendar: (payload: CalendarWritePayload) =>
		postJson(`${BASE}/calendars`, payload, calendarSchema),
	updateCalendar: (id: number, payload: CalendarWritePayload) =>
		putJson(`${BASE}/calendars/${id}`, payload, calendarSchema),
	removeCalendar: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/calendars/${id}`);
	},
	share: (id: number, email: string, permission: 'read' | 'write') =>
		postJson(`${BASE}/calendars/${id}/share`, { email, permission }, calendarSchema),
	unshare: async (id: number, userId: number): Promise<CalendarDto> => {
		const { data } = await apiClient.delete<unknown>(`${BASE}/calendars/${id}/share/${userId}`);
		return calendarSchema.parse(data);
	},
	shareGroup: (id: number, payload: { group_id?: number; code?: string; permission: 'read' | 'write' }) =>
		postJson(`${BASE}/calendars/${id}/share-group`, payload, calendarSchema),
	unshareGroup: async (id: number, groupId: number): Promise<CalendarDto> => {
		const { data } = await apiClient.delete<unknown>(
			`${BASE}/calendars/${id}/share-group/${groupId}`,
		);
		return calendarSchema.parse(data);
	},
	findUserByEmail: (email: string) =>
		getDetail(`${BASE}/users/by-email?email=${encodeURIComponent(email)}`, calendarUserSchema),
	findGroupByCode: (code: string) =>
		getDetail(`${BASE}/groups/by-code?code=${encodeURIComponent(code)}`, calendarGroupSchema),
	queryEvents: (query: CalendarEventsQuery) =>
		postJson(`${BASE}/events/query`, query, z.array(calendarEventSchema)),
	createEvent: (payload: CalendarEventWritePayload) =>
		postJson(`${BASE}/events`, payload, calendarEventSchema),
	updateEvent: (id: number, payload: CalendarEventWritePayload) =>
		putJson(`${BASE}/events/${id}`, payload, calendarEventSchema),
	removeEvent: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/events/${id}`);
	},
};
