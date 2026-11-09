import axios, { type AxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import { SshHostKeyError } from '@/core/api/endpoints/sshApi';

const linkSchema = z.object({
	id: z.number(),
	kind: z.string(),
	name: z.string(),
	host: z.string(),
	port: z.number(),
	username: z.string(),
	has_secret: z.boolean(),
	driver: z.string(),
	database_name: z.string(),
	listen_port: z.number(),
	target_host: z.string(),
	target_port: z.number(),
	ssh_connection_id: z.number().nullable(),
	running: z.boolean(),
});

const querySchema = z.object({
	columns: z.array(z.string()),
	rows: z.array(z.array(z.string().nullable())),
	affected: z.number(),
	truncated: z.boolean(),
});

const containerSchema = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string(),
	state: z.string(),
	status: z.string(),
});

export type OpsKind = 'db' | 'docker' | 'vnc' | 'tunnel';
export type OpsLink = z.infer<typeof linkSchema>;
export type OpsQueryResult = z.infer<typeof querySchema>;
export type DockerContainer = z.infer<typeof containerSchema>;

export type OpsWrite = {
	name: string;
	host?: string;
	port?: number;
	username?: string;
	secret?: string;
	driver?: string;
	database_name?: string;
	listen_port?: number;
	target_host?: string;
	target_port?: number;
	ssh_connection_id?: number | null;
};

const quiet = { _errorToastShown: true } as AxiosRequestConfig & { _errorToastShown: boolean };

export const opsApi = {
	list: async (kind: OpsKind): Promise<OpsLink[]> => {
		const { data } = await apiClient.get<unknown>(`/api/ops/${kind}`);
		return z.array(linkSchema).parse(data);
	},
	create: async (kind: OpsKind, payload: OpsWrite): Promise<OpsLink> => {
		const { data } = await apiClient.post<unknown>(`/api/ops/${kind}`, payload);
		return linkSchema.parse(data);
	},
	update: async (kind: OpsKind, id: number, payload: OpsWrite): Promise<OpsLink> => {
		const { data } = await apiClient.put<unknown>(`/api/ops/${kind}/${id}`, payload);
		return linkSchema.parse(data);
	},
	remove: async (kind: OpsKind, id: number): Promise<void> => {
		await apiClient.delete(`/api/ops/${kind}/${id}`);
	},
	query: async (id: number, sql: string): Promise<OpsQueryResult> => {
		const { data } = await apiClient.post<unknown>(`/api/ops/db/${id}/query`, { sql }, quiet);
		return querySchema.parse(data);
	},
	containers: async (id: number): Promise<DockerContainer[]> => {
		const { data } = await apiClient.get<unknown>(`/api/ops/docker/${id}/containers`, quiet);
		return z.array(containerSchema).parse(data);
	},
	containerAction: async (id: number, containerId: string, action: 'start' | 'stop'): Promise<void> => {
		await apiClient.post(`/api/ops/docker/${id}/containers/${containerId}/${action}`, {}, quiet);
	},
	logs: async (id: number, containerId: string): Promise<string> => {
		const { data } = await apiClient.get<unknown>(`/api/ops/docker/${id}/containers/${containerId}/logs`, quiet);
		return z.object({ text: z.string() }).parse(data).text;
	},
	frame: async (
		id: number,
		body: { x?: number; y?: number; button?: number; key?: number },
	): Promise<Blob> => {
		try {
			const response = await apiClient.post<Blob>(`/api/ops/vnc/${id}/frame`, body, {
				...quiet,
				responseType: 'blob',
			});
			const type = String(response.headers['content-type'] ?? '');
			if (type.includes('json')) {
				throw new Error(await blobMessage(response.data));
			}
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
				throw new Error(await blobMessage(error.response.data));
			}
			throw error;
		}
	},
	tunnelStart: async (id: number, acceptHostKey = false): Promise<void> => {
		try {
			await apiClient.post(`/api/ops/tunnel/${id}/start`, { accept_host_key: acceptHostKey }, quiet);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 409) {
				const payload = error.response.data as { fingerprint?: unknown };
				if (typeof payload?.fingerprint === 'string') {
					throw new SshHostKeyError(payload.fingerprint);
				}
			}
			throw error;
		}
	},
	tunnelStop: async (id: number): Promise<void> => {
		await apiClient.post(`/api/ops/tunnel/${id}/stop`, {}, quiet);
	},
};

async function blobMessage(blob: Blob): Promise<string> {
	try {
		const payload = JSON.parse(await blob.text()) as { message?: unknown };
		if (typeof payload.message === 'string' && payload.message.length > 0) {
			return payload.message;
		}
	} catch {
		return 'Запрос не выполнен';
	}
	return 'Запрос не выполнен';
}
