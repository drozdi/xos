import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import { getDetail } from '@/core/api/crudHelpers';

const BASE = '/api/pkb';

const pkbVaultConfigSchema = z.object({
	version: z.number(),
	created_at: z.string(),
	name: z.string(),
	defaultNoteFolder: z.string(),
	templatesFolder: z.string().optional(),
	attachmentFolder: z.string(),
	dailyNotes: z.object({
		enabled: z.boolean(),
		format: z.string(),
		folder: z.string(),
	}),
	wikilink: z.object({
		caseSensitive: z.boolean(),
		extension: z.string(),
	}),
});

export const pkbHealthResponseSchema = z.object({ status: z.literal('ok') });

export const pkbVaultPermissionsSchema = z.object({
	can_view: z.boolean(),
	can_read_files: z.boolean(),
	can_write: z.boolean(),
	can_manage_members: z.boolean(),
	can_update: z.boolean(),
	can_delete: z.boolean(),
	can_rebuild_index: z.boolean(),
});

export const pkbVaultMemberSchema = z.object({
	user_id: z.number().nullable().optional(),
	email: z.string().nullable().optional(),
	alias: z.string().nullable().optional(),
	role: z.enum(['owner', 'reader', 'editor']),
	is_owner: z.boolean().optional(),
});

export type PkbVaultPermissions = z.infer<typeof pkbVaultPermissionsSchema>;
export type PkbVaultMember = z.infer<typeof pkbVaultMemberSchema>;

export const pkbVaultSummarySchema = z.object({
	id: z.number(),
	name: z.string(),
	slug: z.string(),
	root_path: z.string(),
	is_personal: z.boolean(),
	is_owner: z.boolean(),
	role: z.enum(['owner', 'reader', 'editor']).nullable().optional(),
	permissions: pkbVaultPermissionsSchema.optional(),
	index_version: z.number(),
	index_stale: z.boolean(),
	updated_at: z.string().nullable().optional(),
});

export const pkbVaultDetailSchema = pkbVaultSummarySchema.extend({
	config: pkbVaultConfigSchema.nullable().optional(),
	created_at: z.string().nullable().optional(),
});

export type PkbVaultSummary = z.infer<typeof pkbVaultSummarySchema>;
export type PkbVaultDetail = z.infer<typeof pkbVaultDetailSchema>;

export interface PkbFileTreeNode {
	name: string;
	path: string;
	type: 'folder' | 'file';
	extension?: string | null;
	hidden?: boolean;
	children?: PkbFileTreeNode[];
}

export const pkbFileTreeNodeSchema: z.ZodType<PkbFileTreeNode> = z.lazy(() =>
	z.object({
		name: z.string(),
		path: z.string(),
		type: z.enum(['folder', 'file']),
		extension: z.string().nullable().optional(),
		hidden: z.boolean().optional(),
		children: z.array(pkbFileTreeNodeSchema).optional(),
	}),
);

export const pkbFileEntrySchema = z.object({
	name: z.string(),
	path: z.string(),
	type: z.enum(['folder', 'file']),
	extension: z.string().nullable().optional(),
	size: z.number().nullable().optional(),
	modified_at: z.string().nullable().optional(),
});

export type PkbFileEntry = z.infer<typeof pkbFileEntrySchema>;

export const pkbNoteSummarySchema = z.object({
	path: z.string(),
	title: z.string(),
	tags: z.array(z.string()),
	inbound_count: z.number(),
	outbound_count: z.number(),
});

export type PkbNoteSummary = z.infer<typeof pkbNoteSummarySchema>;

export const pkbNotesResponseSchema = z.object({
	notes: z.array(pkbNoteSummarySchema),
});

export const pkbBacklinkSchema = z.object({
	sourcePath: z.string(),
	sourceTitle: z.string(),
	linkType: z.string(),
	alias: z.string().nullable().optional(),
});

export type PkbBacklink = z.infer<typeof pkbBacklinkSchema>;

export const pkbBacklinksResponseSchema = z.object({
	backlinks: z.array(pkbBacklinkSchema),
});

export const pkbNoteByTitleSchema = z.object({
	path: z.string().nullable(),
	title: z.string(),
	ambiguous: z.boolean(),
	candidates: z
		.array(
			z.object({
				path: z.string(),
				title: z.string(),
			}),
		)
		.optional(),
});

export type PkbNoteByTitle = z.infer<typeof pkbNoteByTitleSchema>;

export const pkbGraphNodeSchema = z.object({
	id: z.string(),
	title: z.string(),
	degree: z.number(),
	tags: z.array(z.string()),
});

export const pkbGraphEdgeSchema = z.object({
	source: z.string(),
	target: z.string(),
	type: z.string(),
});

export type PkbGraphNode = z.infer<typeof pkbGraphNodeSchema>;
export type PkbGraphEdge = z.infer<typeof pkbGraphEdgeSchema>;

export const pkbGraphResponseSchema = z.object({
	nodes: z.array(pkbGraphNodeSchema),
	edges: z.array(pkbGraphEdgeSchema),
});

export const pkbSearchResultSchema = z.object({
	path: z.string(),
	title: z.string(),
	excerpt: z.string().nullable().optional(),
	tags: z.array(z.string()),
	score: z.number().optional(),
});

export type PkbSearchResult = z.infer<typeof pkbSearchResultSchema>;

export const pkbSearchResponseSchema = z.object({
	results: z.array(pkbSearchResultSchema),
});

export const pkbIndexStatusSchema = z.object({
	stale: z.boolean(),
	noteCount: z.number(),
	lastIndexedAt: z.string().nullable().optional(),
	index_version: z.number(),
});

export type PkbIndexStatus = z.infer<typeof pkbIndexStatusSchema>;

export const pkbIndexRebuildResponseSchema = z.object({
	noteCount: z.number(),
	indexed: z.number(),
	removed: z.number(),
	index_version: z.number(),
});

export const pkbBookmarkItemSchema = z.object({
	path: z.string(),
	title: z.string(),
	addedAt: z.string(),
});

export type PkbBookmarkItem = z.infer<typeof pkbBookmarkItemSchema>;

export const pkbBookmarksResponseSchema = z.object({
	version: z.number(),
	items: z.array(pkbBookmarkItemSchema),
});

export type PkbBookmarksResponse = z.infer<typeof pkbBookmarksResponseSchema>;

export const pkbSearchReplaceResponseSchema = z.object({
	matchedFiles: z.number(),
	replacedFiles: z.number(),
	paths: z.array(z.string()),
});

export type PkbSearchReplaceResponse = z.infer<typeof pkbSearchReplaceResponseSchema>;

const pkbFileIndexSchema = z.object({
	path: z.string(),
	title: z.string(),
	tags: z.array(z.string()),
});

export const pkbFileContentPutResponseSchema = pkbFileEntrySchema.extend({
	index: pkbFileIndexSchema.optional(),
});

export type VaultWritePayload = {
	name: string;
	slug?: string;
	rootPath?: string;
};

export const pkbApi = {
	health: () =>
		apiClient.get<unknown>(`${BASE}/health`).then(({ data }) => pkbHealthResponseSchema.parse(data)),

	vaults: () =>
		apiClient.get<unknown>(`${BASE}/vaults`).then(({ data }) => z.array(pkbVaultSummarySchema).parse(data)),

	vault: (id: number) =>
		apiClient.get<unknown>(`${BASE}/vaults/${id}`).then(({ data }) => pkbVaultDetailSchema.parse(data)),

	createVault: (payload: VaultWritePayload) =>
		apiClient
			.post<unknown>(`${BASE}/vaults`, payload)
			.then(({ data }) => pkbVaultDetailSchema.parse(data)),

	updateVault: (id: number, payload: Partial<VaultWritePayload>) =>
		apiClient
			.put<unknown>(`${BASE}/vaults/${id}`, payload)
			.then(({ data }) => pkbVaultDetailSchema.parse(data)),

	removeVault: (id: number, deleteFiles = false) =>
		apiClient
			.delete<unknown>(`${BASE}/vaults/${id}`, {
				params: deleteFiles ? { deleteFiles: true } : undefined,
			})
			.then(({ data }) => getDetail(data)),

	fileTree: (vaultId: number, path?: string, depth = 8) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/files/tree`, {
				params: { path: path || undefined, depth },
			})
			.then(({ data }) => pkbFileTreeNodeSchema.parse(data)),

	fileContent: (vaultId: number, path: string) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/files/content`, { params: { path } })
			.then(({ data }) =>
				z.object({ path: z.string(), content: z.string() }).parse(data),
			),

	putFileContent: (vaultId: number, path: string, content: string) =>
		apiClient
			.put<unknown>(`${BASE}/vaults/${vaultId}/files/content`, { path, content })
			.then(({ data }) => pkbFileContentPutResponseSchema.parse(data)),

	notes: (vaultId: number) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/notes`)
			.then(({ data }) => pkbNotesResponseSchema.parse(data)),

	backlinks: (vaultId: number, path: string) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/backlinks`, { params: { path } })
			.then(({ data }) => pkbBacklinksResponseSchema.parse(data)),

	noteByTitle: (vaultId: number, title: string) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/notes/by-title`, { params: { title } })
			.then(({ data }) => pkbNoteByTitleSchema.parse(data)),

	graph: (vaultId: number, filter?: string, limit = 1000) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/graph`, {
				params: { filter: filter || undefined, limit },
			})
			.then(({ data }) => pkbGraphResponseSchema.parse(data)),

	search: (vaultId: number, query: string) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/search`, { params: { q: query } })
			.then(({ data }) => pkbSearchResponseSchema.parse(data)),

	indexStatus: (vaultId: number) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/index/status`)
			.then(({ data }) => pkbIndexStatusSchema.parse(data)),

	rebuildIndex: (vaultId: number) =>
		apiClient
			.post<unknown>(`${BASE}/vaults/${vaultId}/index/rebuild`)
			.then(({ data }) => pkbIndexRebuildResponseSchema.parse(data)),

	createFolder: (vaultId: number, path: string) =>
		apiClient
			.post<unknown>(`${BASE}/vaults/${vaultId}/files/folder`, { path })
			.then(({ data }) => pkbFileEntrySchema.parse(data)),

	deleteFileItem: (vaultId: number, path: string) =>
		apiClient
			.delete<unknown>(`${BASE}/vaults/${vaultId}/files/item`, { params: { path } })
			.then(({ data }) => getDetail(data)),

	renameFile: (vaultId: number, fromPath: string, toPath: string) =>
		apiClient
			.patch<unknown>(`${BASE}/vaults/${vaultId}/files/rename`, { fromPath, toPath })
			.then(({ data }) => pkbFileEntrySchema.parse(data)),

	uploadFile: (vaultId: number, folderPath: string, file: File) => {
		const formData = new FormData();
		formData.append('path', folderPath);
		formData.append('file', file);
		return apiClient
			.post<unknown>(`${BASE}/vaults/${vaultId}/files/upload`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})
			.then(({ data }) => pkbFileEntrySchema.parse(data));
	},

	listVaultMembers: (vaultId: number) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/members`)
			.then(({ data }) => z.array(pkbVaultMemberSchema).parse(data)),

	inviteVaultMember: (
		vaultId: number,
		payload: { email?: string; userId?: number; role: string },
	) =>
		apiClient
			.post<unknown>(`${BASE}/vaults/${vaultId}/members`, payload)
			.then(({ data }) => z.array(pkbVaultMemberSchema).parse(data)),

	updateVaultMember: (vaultId: number, userId: number, role: string) =>
		apiClient
			.put<unknown>(`${BASE}/vaults/${vaultId}/members/${userId}`, { role })
			.then(({ data }) => z.array(pkbVaultMemberSchema).parse(data)),

	removeVaultMember: (vaultId: number, userId: number) =>
		apiClient
			.delete<unknown>(`${BASE}/vaults/${vaultId}/members/${userId}`)
			.then(({ data }) => z.array(pkbVaultMemberSchema).parse(data)),

	bookmarks: (vaultId: number) =>
		apiClient
			.get<unknown>(`${BASE}/vaults/${vaultId}/bookmarks`)
			.then(({ data }) => pkbBookmarksResponseSchema.parse(data)),

	putBookmarks: (vaultId: number, items: PkbBookmarkItem[]) =>
		apiClient
			.put<unknown>(`${BASE}/vaults/${vaultId}/bookmarks`, { items })
			.then(({ data }) => pkbBookmarksResponseSchema.parse(data)),

	searchReplace: (
		vaultId: number,
		payload: { find: string; replace: string; dryRun?: boolean },
	) =>
		apiClient
			.post<unknown>(`${BASE}/vaults/${vaultId}/search/replace`, payload)
			.then(({ data }) => pkbSearchReplaceResponseSchema.parse(data)),
};
