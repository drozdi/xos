import { api } from '@inccom/shared/api';

export interface FnsCredentialsPublic {
	configured: boolean;
	server: string | null;
	username: string | null;
	master_token_masked: string | null;
}

export interface FnsCredentialsWrite {
	server: string;
	username: string;
	master_token: string;
}

export interface FnsReceiptPreviewPayload {
	fn?: string | null;
	fd?: string | null;
	fp?: string | null;
	fpd?: string | null;
	amount?: string | number | null;
	date?: string | null;
	type?: string | null;
}

export interface FnsReceiptResult {
	check: { code: number | null; message: string | null };
	ticket: unknown;
	error?: string;
	transaction?: unknown;
}

export async function requestFnsCredentials(): Promise<FnsCredentialsPublic> {
	const res = await api.get<FnsCredentialsPublic>('/fns/credentials');
	return res.data;
}

export async function saveFnsCredentials(
	data: FnsCredentialsWrite,
): Promise<FnsCredentialsPublic> {
	const res = await api.put<FnsCredentialsPublic>('/fns/credentials', data);
	return res.data;
}

export async function deleteFnsCredentials(): Promise<void> {
	await api.delete('/fns/credentials');
}

export async function previewFnsReceipt(
	payload: FnsReceiptPreviewPayload,
): Promise<FnsReceiptResult> {
	const res = await api.post<FnsReceiptResult>('/receipts/preview', payload);
	return res.data;
}

export async function fetchTransactionReceipt(
	transactionId: number,
	payload?: FnsReceiptPreviewPayload,
): Promise<FnsReceiptResult> {
	const res = await api.post<FnsReceiptResult>(
		`/transactions/${transactionId}/receipt/fetch`,
		payload ?? {},
	);
	return res.data;
}
