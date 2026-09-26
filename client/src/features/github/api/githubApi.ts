import { apiClient } from '@/core/api/client';
import { extractApiErrorMessage } from '@/core/api/apiError';

const BASE = '/api/github';

export interface GithubCredentialsPublic {
	configured: boolean;
	access_token_masked: string | null;
	default_owner: string | null;
	default_repo: string | null;
	github_login?: string | null;
	encryption?: boolean;
}

export interface GithubCredentialsWrite {
	access_token: string;
	default_owner?: string | null;
	default_repo?: string | null;
	github_login?: string | null;
}

export interface GithubConnectionTestResult {
	ok: boolean;
	status: number | null;
	message: string;
	login?: string | null;
}

export interface GithubIssueSummary {
	id?: number;
	number?: number;
	title?: string;
	body?: string | null;
	state?: string | null;
	html_url?: string | null;
	user?: { login?: string } | null;
	pull_request?: unknown;
}

export interface GithubIssueUpdate {
	title?: string;
	body?: string;
	state?: string;
	owner?: string;
	repo?: string;
}

function unwrapList<T>(data: unknown): T[] {
	if (Array.isArray(data)) {
		return data as T[];
	}
	return [];
}

export async function requestGithubCredentials(): Promise<GithubCredentialsPublic> {
	const res = await apiClient.get<GithubCredentialsPublic>(`${BASE}/credentials`);
	return res.data;
}

export async function saveGithubCredentials(
	data: GithubCredentialsWrite,
): Promise<GithubCredentialsPublic> {
	const res = await apiClient.put<GithubCredentialsPublic>(`${BASE}/credentials`, data);
	return res.data;
}

export async function deleteGithubCredentials(): Promise<void> {
	await apiClient.delete(`${BASE}/credentials`);
}

export async function testGithubConnection(): Promise<GithubConnectionTestResult> {
	try {
		const res = await apiClient.post<GithubConnectionTestResult>(`${BASE}/connection/test`);
		return res.data;
	} catch (error) {
		const data = (error as { response?: { data?: GithubConnectionTestResult & { error?: string } } })
			?.response?.data;
		if (data && typeof data.ok === 'boolean') {
			return data;
		}
		throw new Error(extractApiErrorMessage(error) || 'Ошибка проверки связи');
	}
}

export async function listGithubIssues(params?: {
	owner?: string;
	repo?: string;
	state?: string;
	page?: number;
	per_page?: number;
}): Promise<GithubIssueSummary[]> {
	const res = await apiClient.get<unknown>(`${BASE}/issues`, { params });
	return unwrapList<GithubIssueSummary>(res.data).filter((item) => !item.pull_request);
}

export async function getGithubIssue(
	number: number,
	params?: { owner?: string; repo?: string },
): Promise<GithubIssueSummary> {
	const res = await apiClient.get<GithubIssueSummary>(`${BASE}/issues/${number}`, { params });
	return res.data;
}

export async function updateGithubIssue(
	number: number,
	payload: GithubIssueUpdate,
): Promise<GithubIssueSummary> {
	const res = await apiClient.patch<GithubIssueSummary>(`${BASE}/issues/${number}`, payload);
	return res.data;
}
