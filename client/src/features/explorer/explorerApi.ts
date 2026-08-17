import { z } from 'zod';

import { apiClient } from '@/core/api/client';

const BASE = '/api/explorer';

export const explorerDiskSchema = z.object({
	code: z.string(),
	label: z.string(),
	source: z.enum(['system', 'personal', 'user']),
	adapter: z.string(),
	readOnly: z.boolean(),
	permissions: z.array(z.string()),
	id: z.number().optional(),
});

export const explorerEntrySchema = z.object({
	path: z.string().optional(),
	name: z.string(),
	relativePath: z.string(),
	type: z.enum(['file', 'folder']),
	fileType: z.string(),
	extension: z.string().nullable().optional(),
	size: z.number(),
	modifiedAt: z.string(),
	permissions: z.array(z.string()),
	permissionsMask: z.number().optional(),
	openWith: z.array(z.string()).optional(),
	disk: z.string().optional(),
});

export type ExplorerDisk = z.infer<typeof explorerDiskSchema>;
export type ExplorerEntry = z.infer<typeof explorerEntrySchema>;

export type ExplorerSortBy = 'name' | 'size' | 'type';
export type ExplorerSortDir = 'asc' | 'desc';

export async function fetchExplorerConfig() {
	const { data } = await apiClient.get<unknown>(`${BASE}/config`);
	return data as {
		disks: ExplorerDisk[];
		fileTypes: Record<string, { label: string; extensions: string[] }>;
		openWith: Record<string, string[]>;
		sortOptions: ExplorerSortBy[];
	};
}

export async function fetchExplorerList(
	path: string,
	sortBy: ExplorerSortBy = 'name',
	sortDir: ExplorerSortDir = 'asc',
) {
	const { data } = await apiClient.get<unknown>(`${BASE}/list`, {
		params: { path, sortBy, sortDir },
	});
	const parsed = z
		.object({
			path: z.string(),
			sortBy: z.string(),
			sortDir: z.string(),
			items: z.array(explorerEntrySchema),
		})
		.parse(data);

	return parsed;
}

export async function fetchExplorerTree(path: string, depth = 2) {
	const { data } = await apiClient.get<unknown>(`${BASE}/tree`, {
		params: { path, depth },
	});
	return data;
}

export async function createExplorerFolder(path: string) {
	const { data } = await apiClient.post<unknown>(`${BASE}/folder`, { path });
	return explorerEntrySchema.parse(data);
}

export async function renameExplorerItem(path: string, newName: string) {
	const { data } = await apiClient.patch<unknown>(`${BASE}/rename`, { path, newName });
	return explorerEntrySchema.parse(data);
}

export async function deleteExplorerItem(path: string, permanent = false) {
	await apiClient.delete(`${BASE}/item`, { params: { path, permanent: permanent || undefined } });
}

export async function fetchExplorerTrash(disk: string) {
	const { data } = await apiClient.get<unknown>(`${BASE}/trash`, { params: { disk } });
	return data as { disk: string; items: ExplorerEntry[] };
}

export async function restoreExplorerTrashItem(path: string) {
	const { data } = await apiClient.post<unknown>(`${BASE}/trash/restore`, { path });
	return explorerEntrySchema.parse(data);
}

export async function emptyExplorerTrash(disk: string) {
	await apiClient.delete(`${BASE}/trash`, { params: { disk } });
}

export function isTargetExistsError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}
	const response = (error as { response?: { data?: { message?: string } } }).response;
	const message = response?.data?.message ?? '';
	return message.toLowerCase().includes('already exists') || message.toLowerCase().includes('уже существует');
}

export async function uploadExplorerFile(path: string, file: File) {
	const form = new FormData();
	form.append('path', path);
	form.append('file', file);
	const { data } = await apiClient.post<unknown>(`${BASE}/upload`, form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return explorerEntrySchema.parse(data);
}

export function getExplorerContentUrl(path: string) {
	return `${BASE}/content?path=${encodeURIComponent(path)}`;
}

export function getExplorerDownloadUrl(path: string) {
	return `${BASE}/download?path=${encodeURIComponent(path)}`;
}

export async function createUserDisk(payload: {
	code: string;
	label: string;
	adapter: string;
	root: string;
}) {
	const { data } = await apiClient.post<unknown>(`${BASE}/disks`, payload);
	return data;
}

export async function saveExplorerText(path: string, content: string) {
	const { data } = await apiClient.put<unknown>(`${BASE}/content`, { path, content });
	return explorerEntrySchema.parse(data);
}

export async function fetchExplorerInfo(path: string) {
	const { data } = await apiClient.get<unknown>(`${BASE}/info`, { params: { path } });
	return explorerEntrySchema.parse(data);
}

export function canWriteExplorerEntry(permissions: string[] | undefined): boolean {
	return permissions?.includes('write') ?? false;
}

export async function copyExplorerItem(from: string, to: string, overwrite = false) {
	const { data } = await apiClient.post<unknown>(`${BASE}/copy`, { from, to, overwrite });
	return explorerEntrySchema.parse(data);
}

export async function moveExplorerItem(from: string, to: string, overwrite = false) {
	const { data } = await apiClient.post<unknown>(`${BASE}/move`, { from, to, overwrite });
	return explorerEntrySchema.parse(data);
}

export interface UserDiskRecord {
	id: number;
	code: string;
	label: string;
	adapter: string;
	config: { root?: string; readOnly?: boolean };
	sort?: number;
}

export async function fetchUserDisks() {
	const { data } = await apiClient.get<unknown>(`${BASE}/disks`);
	return data as UserDiskRecord[];
}

export async function deleteUserDisk(id: number) {
	await apiClient.delete(`${BASE}/disks/${id}`);
}

export interface ArchiveEntry {
	name: string;
	size: number;
	folder: boolean;
}

export async function fetchArchiveContents(path: string) {
	const { data } = await apiClient.get<unknown>(`${BASE}/archive/list`, { params: { path } });
	return data as { path: string; items: ArchiveEntry[] };
}

export async function packExplorerArchive(sources: string[], destination: string) {
	const { data } = await apiClient.post<unknown>(`${BASE}/archive/pack`, { sources, destination });
	return explorerEntrySchema.parse(data);
}

export async function unpackExplorerArchive(archive: string, destination: string) {
	const { data } = await apiClient.post<unknown>(`${BASE}/archive/unpack`, { archive, destination });
	return data as { archive: string; destination: string; extracted: number };
}
