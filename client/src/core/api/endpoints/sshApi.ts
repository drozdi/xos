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
	gatewayTicket: async (
		connectionId: number,
	): Promise<{ ticket: string; gateway_url: string | null }> => {
		const { data } = await apiClient.post<unknown>('/api/ssh/gateway/ticket', {
			connection_id: connectionId,
		});
		return z
			.object({
				ticket: z.string(),
				gateway_url: z.string().nullable(),
			})
			.parse(data);
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
	sftpList: async (body: SftpRequest): Promise<SftpList> =>
		sftpJson('/api/ssh/sftp/list', body, (data) => sftpListSchema.parse(data)),
	sftpMkdir: async (body: SftpRequest & { name: string }): Promise<void> => {
		await sftpJson('/api/ssh/sftp/mkdir', body, () => true);
	},
	sftpRemove: async (body: SftpRequest): Promise<void> => {
		await sftpJson('/api/ssh/sftp/remove', body, () => true);
	},
	sftpRename: async (body: SftpRequest & { name: string }): Promise<void> => {
		await sftpJson('/api/ssh/sftp/rename', body, () => true);
	},
	sftpUpload: async (body: SftpRequest, file: File): Promise<void> => {
		const form = new FormData();
		form.set('connection_id', String(body.connection_id));
		form.set('path', body.path);
		form.set('accept_host_key', body.accept_host_key ? '1' : '0');
		form.set('file', file);
		try {
			const config: AxiosRequestConfig & { _errorToastShown: boolean } = { _errorToastShown: true };
			await apiClient.post('/api/ssh/sftp/upload', form, config);
		} catch (error) {
			throw await sftpError(error);
		}
	},
	sftpDownload: async (body: SftpRequest): Promise<Blob> => {
		try {
			const config: AxiosRequestConfig & { _errorToastShown: boolean } = {
				_errorToastShown: true,
				responseType: 'blob',
				params: {
					connection_id: body.connection_id,
					path: body.path,
					accept_host_key: body.accept_host_key ? 1 : 0,
				},
			};
			const response = await apiClient.get<Blob>('/api/ssh/sftp/download', config);
			const type = String(response.headers['content-type'] ?? '');
			if (type.includes('json')) {
				throw await sftpError(response.data);
			}
			return response.data;
		} catch (error) {
			throw await sftpError(error);
		}
	},
};

const sftpEntrySchema = z.object({
	name: z.string(),
	dir: z.boolean(),
	size: z.number(),
	mtime: z.number(),
});

const sftpListSchema = z.object({
	path: z.string(),
	entries: z.array(sftpEntrySchema),
});

export type SftpEntry = z.infer<typeof sftpEntrySchema>;
export type SftpList = z.infer<typeof sftpListSchema>;
export type SftpRequest = {
	connection_id: number;
	path: string;
	accept_host_key?: boolean;
};

async function sftpJson<T>(url: string, body: SftpRequest, parse: (data: unknown) => T): Promise<T> {
	try {
		const config: AxiosRequestConfig & { _errorToastShown: boolean } = { _errorToastShown: true };
		const { data } = await apiClient.post<unknown>(url, body, config);
		return parse(data);
	} catch (error) {
		throw await sftpError(error);
	}
}

async function sftpError(error: unknown): Promise<Error> {
	if (error instanceof SshHostKeyError) {
		return error;
	}
	if (error instanceof Blob) {
		return blobError(error);
	}
	if (axios.isAxiosError(error) && error.response?.status === 409) {
		const payload = await payloadOf(error.response.data);
		if (typeof payload?.fingerprint === 'string') {
			return new SshHostKeyError(payload.fingerprint);
		}
	}
	if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
		return blobError(error.response.data);
	}
	return error instanceof Error ? error : new Error('Запрос не выполнен');
}

async function blobError(blob: Blob): Promise<Error> {
	const payload = await payloadOf(blob);
	if (typeof payload?.fingerprint === 'string') {
		return new SshHostKeyError(payload.fingerprint);
	}
	if (typeof payload?.message === 'string' && payload.message.length > 0) {
		return new Error(payload.message);
	}
	return new Error('Запрос не выполнен');
}

async function payloadOf(data: unknown): Promise<{ fingerprint?: unknown; message?: unknown } | null> {
	if (data instanceof Blob) {
		try {
			return JSON.parse(await data.text()) as { fingerprint?: unknown; message?: unknown };
		} catch {
			return null;
		}
	}
	if (data && typeof data === 'object') {
		return data as { fingerprint?: unknown; message?: unknown };
	}
	return null;
}
