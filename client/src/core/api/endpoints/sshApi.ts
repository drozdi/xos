import axios, { type AxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { apiBaseURL, apiClient } from '@/core/api/client';
import { getAccessToken } from '@/core/auth/tokenStorage';

const connectionSchema = z.object({
	id: z.number(),
	name: z.string(),
	host: z.string(),
	port: z.number(),
	username: z.string(),
	auth: z.enum(['password', 'key']),
	has_secret: z.boolean(),
	has_passphrase: z.boolean(),
	key_id: z.number().nullable(),
	key_name: z.string().nullable(),
	inline_key: z.boolean(),
	host_key_fingerprint: z.string().nullable(),
});

const keySchema = z.object({
	id: z.number(),
	name: z.string(),
	type: z.string(),
	fingerprint: z.string(),
	public_key: z.string(),
	has_passphrase: z.boolean(),
});

const sessionSchema = z.object({
	id: z.string(),
	columns: z.number(),
	rows: z.number(),
	source_ip: z.string().nullable(),
});

export type SshConnection = z.infer<typeof connectionSchema>;
export type SshKey = z.infer<typeof keySchema>;
export type SshAuth = SshConnection['auth'];

export type SshConnectionWrite = {
	name: string;
	host: string;
	port: number;
	username: string;
	auth: SshAuth;
	secret?: string;
	passphrase?: string | null;
	key_id?: number | null;
};

export class SshHostKeyError extends Error {
	readonly fingerprint: string;

	constructor(fingerprint: string) {
		super('Ключ сервера не совпадает с сохранённым');
		this.name = 'SshHostKeyError';
		this.fingerprint = fingerprint;
	}
}

export const sshApi = {
	list: async (): Promise<SshConnection[]> => {
		const { data } = await apiClient.get<unknown>('/api/ssh/connections');
		return z.array(connectionSchema).parse(data);
	},
	create: async (payload: SshConnectionWrite): Promise<SshConnection> => {
		const { data } = await apiClient.post<unknown>('/api/ssh/connections', payload);
		return connectionSchema.parse(data);
	},
	update: async (id: number, payload: SshConnectionWrite): Promise<SshConnection> => {
		const { data } = await apiClient.put<unknown>(`/api/ssh/connections/${id}`, payload);
		return connectionSchema.parse(data);
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/ssh/connections/${id}`);
	},
	keys: async (): Promise<SshKey[]> => {
		const { data } = await apiClient.get<unknown>('/api/ssh/keys');
		return z.array(keySchema).parse(data);
	},
	importKey: async (payload: { name: string; secret: string; passphrase?: string }): Promise<SshKey> => {
		const { data } = await apiClient.post<unknown>('/api/ssh/keys', payload);
		return keySchema.parse(data);
	},
	generateKey: async (payload: { name: string; type: 'ed25519' | 'rsa'; passphrase?: string }): Promise<SshKey> => {
		const { data } = await apiClient.post<unknown>('/api/ssh/keys/generate', payload);
		return keySchema.parse(data);
	},
	removeKey: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/ssh/keys/${id}`);
	},
	openSession: async (body: {
		connection_id: number;
		accept_host_key?: boolean;
		columns: number;
		rows: number;
	}): Promise<{ id: string; columns: number; rows: number; source_ip: string | null }> => {
		try {
			const config: AxiosRequestConfig & { _errorToastShown: boolean } = {
				_errorToastShown: true,
			};
			const { data } = await apiClient.post<unknown>('/api/ssh/sessions', body, config);
			return sessionSchema.parse(data);
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
	sendInput: async (sessionId: string, data: string): Promise<void> => {
		await apiClient.post(`/api/ssh/sessions/${sessionId}/input`, { data });
	},
	close: async (sessionId: string): Promise<void> => {
		await apiClient.delete(`/api/ssh/sessions/${sessionId}`);
	},
	streamUrl: (sessionId: string): string => `${apiBaseURL}/api/ssh/sessions/${sessionId}/stream`,
	streamHeaders: (): HeadersInit => {
		const token = getAccessToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	},
};
