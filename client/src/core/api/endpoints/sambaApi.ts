import { z } from 'zod';

import { apiClient } from '@/core/api/client';

const serverSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	role: z.string(),
	file: z.boolean(),
	status: z.string(),
	expected_timezone: z.string(),
	owner: z.boolean(),
	owner_label: z.string(),
	can_directory: z.boolean(),
	can_manage: z.boolean(),
	can_shares: z.boolean(),
	access: z.array(
		z.object({
			user_id: z.number(),
			label: z.string(),
			rights: z.array(z.string()),
		}),
	),
});

export type SambaServer = z.infer<typeof serverSchema>;

export type SambaServerWrite = {
	name: string;
	description?: string;
	role: 'ad_dc';
	file: boolean;
	expected_timezone: string;
};

const rights = ['view', 'shares', 'directory', 'provision', 'manage'] as const;
export type SambaRight = (typeof rights)[number];

export const sambaApi = {
	list: async (): Promise<SambaServer[]> => {
		const { data } = await apiClient.get<unknown>('/api/samba/servers');
		return z.array(serverSchema).parse(data);
	},
	get: async (id: number): Promise<SambaServer> => {
		const { data } = await apiClient.get<unknown>(`/api/samba/servers/${id}`);
		return serverSchema.parse(data);
	},
	create: async (payload: SambaServerWrite): Promise<SambaServer> => {
		const { data } = await apiClient.post<unknown>('/api/samba/servers', payload);
		return serverSchema.parse(data);
	},
	update: async (id: number, payload: SambaServerWrite): Promise<SambaServer> => {
		const { data } = await apiClient.put<unknown>(`/api/samba/servers/${id}`, payload);
		return serverSchema.parse(data);
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/samba/servers/${id}`);
	},
	enqueue: async (id: number, type: string, args: Record<string, unknown>): Promise<{ id: number; status: string }> => {
		const { data } = await apiClient.post<unknown>(`/api/samba/servers/${id}/commands`, { type, args });
		return z.object({ id: z.number(), status: z.string() }).parse(data);
	},
	command: async (id: number, commandId: number) => {
		const { data } = await apiClient.get<unknown>(`/api/samba/servers/${id}/commands/${commandId}`);
		return z
			.object({
				id: z.number(),
				type: z.string(),
				status: z.string(),
				result: z.string().nullable(),
				created_at: z.string(),
			})
			.parse(data);
	},
	grant: async (id: number, userId: number, nextRights: SambaRight[]): Promise<SambaServer> => {
		const { data } = await apiClient.post<unknown>(`/api/samba/servers/${id}/access`, {
			user_id: userId,
			rights: nextRights,
		});
		return serverSchema.parse(data);
	},
	revoke: async (id: number, userId: number): Promise<void> => {
		await apiClient.delete(`/api/samba/servers/${id}/access/${userId}`);
	},
	transfer: async (id: number, userId: number): Promise<SambaServer> => {
		const { data } = await apiClient.post<unknown>(`/api/samba/servers/${id}/transfer`, { user_id: userId });
		return serverSchema.parse(data);
	},
	enrollment: async (id: number) => {
		const { data } = await apiClient.post<unknown>(`/api/samba/servers/${id}/enrollment`);
		return z
			.object({
				token: z.string(),
				server_id: z.number(),
				expires_at: z.string(),
				command: z.string(),
			})
			.parse(data);
	},
};
