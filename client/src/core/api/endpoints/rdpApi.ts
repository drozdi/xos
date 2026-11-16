import { z } from 'zod';

import { apiClient } from '@/core/api/client';

const connectionSchema = z.object({
	id: z.number(),
	name: z.string(),
	host: z.string(),
	port: z.number(),
	zone: z.string(),
	zone_detected: z.string(),
	network_id: z.number().nullable(),
	network_name: z.string().nullable(),
	reachable: z.boolean(),
	username: z.string(),
	domain: z.string(),
	has_secret: z.boolean(),
	security: z.string(),
	ignore_cert: z.boolean(),
	cert_fingerprint: z.string().nullable(),
	width: z.number(),
	height: z.number(),
	dpi: z.number(),
	color_depth: z.number(),
	enable_clipboard: z.boolean(),
	enable_audio: z.boolean(),
	enable_drive: z.boolean(),
	keyboard_layout: z.string(),
	resize_method: z.string(),
});

const networkSchema = z.object({
	id: z.number(),
	name: z.string(),
	cidrs: z.array(z.string()),
	dns_suffixes: z.array(z.string()).optional(),
	active: z.boolean().optional(),
	description: z.string().nullable().optional(),
	allow_clipboard: z.boolean().optional(),
	allow_drive: z.boolean().optional(),
	grants: z
		.array(
			z.object({
				id: z.number().nullable(),
				group_id: z.number().nullable(),
				group_name: z.string().nullable(),
				role: z.string().nullable(),
			}),
		)
		.optional(),
});

const checkSchema = z.object({
	zone: z.string().nullable(),
	network: z.string().nullable(),
	allowed: z.boolean(),
	reason: z.string().nullable(),
});

export type RdpConnection = z.infer<typeof connectionSchema>;
export type RdpNetwork = z.infer<typeof networkSchema>;

export type RdpConnectionWrite = {
	name: string;
	host: string;
	port: number;
	zone: string;
	username: string;
	domain?: string;
	secret?: string;
	security: string;
	ignore_cert: boolean;
	width: number;
	height: number;
	dpi: number;
	color_depth: number;
	enable_clipboard: boolean;
	enable_audio: boolean;
	enable_drive: boolean;
	keyboard_layout: string;
	resize_method: string;
};

export const rdpApi = {
	list: async (): Promise<RdpConnection[]> => {
		const { data } = await apiClient.get<unknown>('/api/rdp/connections');
		return z.array(connectionSchema).parse(data);
	},
	create: async (payload: RdpConnectionWrite): Promise<RdpConnection> => {
		const { data } = await apiClient.post<unknown>('/api/rdp/connections', payload);
		return connectionSchema.parse(data);
	},
	update: async (id: number, payload: RdpConnectionWrite): Promise<RdpConnection> => {
		const { data } = await apiClient.put<unknown>(`/api/rdp/connections/${id}`, payload);
		return connectionSchema.parse(data);
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/rdp/connections/${id}`);
	},
	checkHost: async (host: string) => {
		const { data } = await apiClient.post<unknown>('/api/rdp/connections/check-host', { host });
		return checkSchema.parse(data);
	},
	ticket: async (connectionId: number) => {
		const { data } = await apiClient.post<unknown>('/api/rdp/gateway/ticket', { connection_id: connectionId });
		return z.object({ ticket: z.string(), gateway_url: z.string().nullable() }).parse(data);
	},
	networks: async () => {
		const { data } = await apiClient.get<unknown>('/api/rdp/networks');
		return z.array(networkSchema).parse(data);
	},
	adminNetworks: async () => {
		const { data } = await apiClient.get<unknown>('/api/rdp/admin/networks');
		return z.array(networkSchema).parse(data);
	},
	createNetwork: async (payload: { name: string; cidrs: string[]; dns_suffixes: string[]; allow_clipboard: boolean; allow_drive: boolean }) => {
		const { data } = await apiClient.post<unknown>('/api/rdp/admin/networks', payload);
		return networkSchema.parse(data);
	},
	removeNetwork: async (id: number) => {
		await apiClient.delete(`/api/rdp/admin/networks/${id}`);
	},
	replaceGrants: async (id: number, grants: Array<{ group_id?: number; role?: string }>) => {
		const { data } = await apiClient.put<unknown>(`/api/rdp/admin/networks/${id}/grants`, { grants });
		return networkSchema.parse(data);
	},
};
