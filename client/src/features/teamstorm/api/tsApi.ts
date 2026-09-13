import { apiClient } from '@/core/api/client';
import { extractApiErrorMessage } from '@/core/api/apiError';

const BASE = '/api/ts';

export interface TsCredentialsPublic {
	configured: boolean;
	base_url: string | null;
	private_token_masked: string | null;
	ts_username?: string | null;
	encryption?: boolean;
}

export interface TsCredentialsWrite {
	base_url: string;
	private_token: string;
	ts_username?: string | null;
}

export interface TsConnectionTestResult {
	ok: boolean;
	status: number | null;
	message: string;
}

export interface TsWorkspace {
	id?: string;
	key?: string;
	name?: string;
	description?: string | null;
}

export interface TsWorkitemSummary {
	id?: string;
	key?: string;
	name?: string;
	description?: string | null;
	status?: { id?: string; name?: string } | string | null;
	assignee?: { displayName?: string; username?: string; email?: string } | null;
}

export interface TsWorkitemPage {
	fromToken?: string | null;
	maxItemsCount?: number;
	nextToken?: string | null;
	items?: TsWorkitemSummary[];
}

export interface TsWorkitemUpdate {
	name?: string;
	description?: string;
	status?: string;
}

function unwrapList<T>(data: unknown): T[] {
	if (Array.isArray(data)) {
		return data as T[];
	}
	if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
		return (data as { items: T[] }).items;
	}
	return [];
}

export async function requestTsCredentials(): Promise<TsCredentialsPublic> {
	const res = await apiClient.get<TsCredentialsPublic>(`${BASE}/credentials`);
	return res.data;
}

export async function saveTsCredentials(
	data: TsCredentialsWrite,
): Promise<TsCredentialsPublic> {
	const res = await apiClient.put<TsCredentialsPublic>(`${BASE}/credentials`, data);
	return res.data;
}

export async function deleteTsCredentials(): Promise<void> {
	await apiClient.delete(`${BASE}/credentials`);
}

export async function testTsConnection(): Promise<TsConnectionTestResult> {
	try {
		const res = await apiClient.post<TsConnectionTestResult>(`${BASE}/connection/test`);
		return res.data;
	} catch (error) {
		const data = (error as { response?: { data?: TsConnectionTestResult & { error?: string } } })
			?.response?.data;
		if (data && typeof data.ok === 'boolean') {
			return data;
		}
		throw new Error(extractApiErrorMessage(error) || 'Ошибка проверки связи');
	}
}

export async function listTsWorkspaces(): Promise<TsWorkspace[]> {
	const res = await apiClient.get<unknown>(`${BASE}/workspaces`);
	return unwrapList<TsWorkspace>(res.data);
}

export async function listTsWorkitems(
	workspace: string,
	params?: { maxItemsCount?: number; fromToken?: string | null; mine?: boolean },
): Promise<TsWorkitemPage> {
	const res = await apiClient.get<TsWorkitemPage>(
		`${BASE}/workspaces/${encodeURIComponent(workspace)}/workitems`,
		{
			params: {
				maxItemsCount: params?.maxItemsCount ?? 50,
				fromToken: params?.fromToken || undefined,
				mine: params?.mine ? '1' : '0',
			},
		},
	);
	const data = res.data;
	if (Array.isArray(data)) {
		return { items: data as TsWorkitemSummary[], nextToken: null };
	}
	return data ?? { items: [] };
}

export function stripHtml(text: string | null | undefined): string {
	const raw = text || '';
	if (!raw) {
		return '';
	}
	return raw
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/\s+/g, ' ')
		.trim();
}

export function truncateDescription(text: string | null | undefined, max = 120): string {
	const value = stripHtml(text);
	if (!value) {
		return '—';
	}
	if (value.length <= max) {
		return value;
	}
	return `${value.slice(0, max - 1)}…`;
}

export async function getTsWorkitem(
	workspace: string,
	workitem: string,
): Promise<TsWorkitemSummary> {
	const res = await apiClient.get<TsWorkitemSummary>(
		`${BASE}/workspaces/${encodeURIComponent(workspace)}/workitems/${encodeURIComponent(workitem)}`,
	);
	return res.data;
}

export async function updateTsWorkitem(
	workspace: string,
	workitem: string,
	payload: TsWorkitemUpdate,
): Promise<TsWorkitemSummary> {
	const res = await apiClient.patch<TsWorkitemSummary>(
		`${BASE}/workspaces/${encodeURIComponent(workspace)}/workitems/${encodeURIComponent(workitem)}`,
		payload,
	);
	return res.data;
}

export function workspaceRef(ws: TsWorkspace): string {
	return (ws.key || ws.id || '').trim();
}

export function workitemRef(item: TsWorkitemSummary): string {
	return (item.key || item.id || '').trim();
}

export function statusLabel(status: TsWorkitemSummary['status']): string {
	if (!status) {
		return '—';
	}
	if (typeof status === 'string') {
		return status;
	}
	return status.name || status.id || '—';
}
