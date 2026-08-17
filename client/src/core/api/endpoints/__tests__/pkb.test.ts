import { describe, expect, it } from 'vitest';

import {
	pkbBacklinkSchema,
	pkbBacklinksResponseSchema,
	pkbFileContentPutResponseSchema,
	pkbFileTreeNodeSchema,
	pkbGraphEdgeSchema,
	pkbGraphNodeSchema,
	pkbGraphResponseSchema,
	pkbHealthResponseSchema,
	pkbIndexRebuildResponseSchema,
	pkbIndexStatusSchema,
	pkbNoteByTitleSchema,
	pkbNoteSummarySchema,
	pkbNotesResponseSchema,
	pkbSearchResponseSchema,
	pkbSearchResultSchema,
	pkbVaultDetailSchema,
	pkbVaultMemberSchema,
	pkbVaultPermissionsSchema,
	pkbVaultSummarySchema,
	pkbBookmarksResponseSchema,
	pkbSearchReplaceResponseSchema,
} from '@/core/api/endpoints/pkbApi';

describe('pkb endpoints', () => {
	describe('pkbHealthResponseSchema', () => {
		it('parses health response', () => {
			const response = pkbHealthResponseSchema.parse({ status: 'ok' });
			expect(response.status).toBe('ok');
		});
	});

	describe('pkbVaultSummarySchema', () => {
		it('parses vault summary', () => {
			const summary = pkbVaultSummarySchema.parse({
				id: 1,
				name: 'My Vault',
				slug: 'my-vault',
				root_path: 'home://Vaults/my-vault/',
				is_personal: true,
				is_owner: true,
				role: 'owner',
				permissions: {
					can_view: true,
					can_read_files: true,
					can_write: true,
					can_manage_members: true,
					can_update: true,
					can_delete: true,
					can_rebuild_index: true,
				},
				index_version: 0,
				index_stale: false,
				updated_at: '2026-08-17 12:00:00',
			});
			expect(summary.slug).toBe('my-vault');
			expect(summary.permissions?.can_write).toBe(true);
		});
	});

	describe('pkbFileTreeNodeSchema', () => {
		it('parses recursive file tree', () => {
			const tree = pkbFileTreeNodeSchema.parse({
				name: '/',
				path: '',
				type: 'folder',
				children: [
					{
						name: 'Notes',
						path: 'Notes',
						type: 'folder',
						children: [{ name: 'hello.md', path: 'Notes/hello.md', type: 'file', extension: 'md' }],
					},
				],
			});
			expect(tree.children?.[0]?.children?.[0]?.extension).toBe('md');
		});
	});

	describe('phase 3 schemas', () => {
	it('parses notes list response', () => {
		const response = pkbNotesResponseSchema.parse({
			notes: [
				{
					path: 'Notes/hello.md',
					title: 'hello',
					tags: ['project'],
					inbound_count: 1,
					outbound_count: 2,
				},
			],
		});

		expect(response.notes[0]?.title).toBe('hello');
	});

	it('parses backlinks response', () => {
		const response = pkbBacklinksResponseSchema.parse({
			backlinks: [
				{
					sourcePath: 'Notes/source.md',
					sourceTitle: 'source',
					linkType: 'wikilink',
					alias: null,
				},
			],
		});

		expect(response.backlinks[0]?.linkType).toBe('wikilink');
	});

	it('parses note by title response', () => {
		const response = pkbNoteByTitleSchema.parse({
			path: 'Notes/Target.md',
			title: 'Target',
			ambiguous: false,
		});

		expect(response.path).toBe('Notes/Target.md');
	});

	it('parses put content response with index', () => {
		const response = pkbFileContentPutResponseSchema.parse({
			name: 'note.md',
			path: 'Notes/note.md',
			type: 'file',
			extension: 'md',
			index: {
				path: 'Notes/note.md',
				title: 'note',
				tags: [],
			},
		});

		expect(response.index?.title).toBe('note');
	});

	it('parses note summary', () => {
		const summary = pkbNoteSummarySchema.parse({
			path: 'Notes/a.md',
			title: 'A',
			tags: [],
			inbound_count: 0,
			outbound_count: 0,
		});

		expect(summary.path).toBe('Notes/a.md');
	});

	it('parses backlink item', () => {
		const backlink = pkbBacklinkSchema.parse({
			sourcePath: 'Notes/a.md',
			sourceTitle: 'A',
			linkType: 'wikilink',
		});

		expect(backlink.sourceTitle).toBe('A');
	});

	it('parses vault detail with config', () => {
		const detail = pkbVaultDetailSchema.parse({
			id: 1,
			name: 'My Vault',
			slug: 'my-vault',
			root_path: 'home://Vaults/my-vault/',
			is_personal: true,
			is_owner: true,
			index_version: 0,
			index_stale: false,
			config: {
				version: 1,
				created_at: '2026-08-17T11:00:00+00:00',
				name: 'My Vault',
				defaultNoteFolder: 'Notes',
				attachmentFolder: 'attachments',
				dailyNotes: { enabled: false, format: 'YYYY-MM-DD', folder: 'Daily' },
				wikilink: { caseSensitive: false, extension: '.md' },
			},
		});
		expect(detail.config?.defaultNoteFolder).toBe('Notes');
	});
	});

	describe('phase 4 schemas', () => {
		it('parses graph response', () => {
			const response = pkbGraphResponseSchema.parse({
				nodes: [{ id: 'Notes/a.md', title: 'A', degree: 2, tags: ['project'] }],
				edges: [{ source: 'Notes/a.md', target: 'Notes/b.md', type: 'wikilink' }],
			});
			expect(response.nodes[0]?.degree).toBe(2);
		});

		it('parses graph node and edge', () => {
			const node = pkbGraphNodeSchema.parse({ id: 'Notes/a.md', title: 'A', degree: 0, tags: [] });
			const edge = pkbGraphEdgeSchema.parse({
				source: 'Notes/a.md',
				target: 'Notes/b.md',
				type: 'wikilink',
			});
			expect(node.title).toBe('A');
			expect(edge.type).toBe('wikilink');
		});

		it('parses search response', () => {
			const response = pkbSearchResponseSchema.parse({
				results: [
					{
						path: 'Notes/find.md',
						title: 'Find',
						excerpt: 'keyword',
						tags: [],
						score: 10,
					},
				],
			});
			expect(response.results[0]?.score).toBe(10);
		});

		it('parses search result item', () => {
			const result = pkbSearchResultSchema.parse({
				path: 'Notes/x.md',
				title: 'X',
				excerpt: null,
				tags: ['tag'],
			});
			expect(result.tags).toContain('tag');
		});

		it('parses index status', () => {
			const status = pkbIndexStatusSchema.parse({
				stale: true,
				noteCount: 5,
				lastIndexedAt: '2026-08-17 12:00:00',
				index_version: 2,
			});
			expect(status.stale).toBe(true);
		});

		it('parses index rebuild response', () => {
			const rebuilt = pkbIndexRebuildResponseSchema.parse({
				noteCount: 3,
				indexed: 3,
				removed: 1,
				index_version: 4,
			});
			expect(rebuilt.removed).toBe(1);
		});
	});

	describe('phase 5 schemas', () => {
		it('parses vault member', () => {
			const member = pkbVaultMemberSchema.parse({
				user_id: 2,
				email: 'reader@example.com',
				alias: 'Reader',
				role: 'reader',
				is_owner: false,
			});
			expect(member.role).toBe('reader');
		});

		it('parses vault permissions', () => {
			const permissions = pkbVaultPermissionsSchema.parse({
				can_view: true,
				can_read_files: true,
				can_write: false,
				can_manage_members: false,
				can_update: false,
				can_delete: false,
				can_rebuild_index: false,
			});
			expect(permissions.can_write).toBe(false);
		});
	});

	describe('phase 6 schemas', () => {
		it('parses bookmarks response', () => {
			const response = pkbBookmarksResponseSchema.parse({
				version: 1,
				items: [
					{
						path: 'Notes/foo.md',
						title: 'Foo',
						addedAt: '2026-08-17T12:00:00+00:00',
					},
				],
			});
			expect(response.items[0]?.path).toBe('Notes/foo.md');
		});

		it('parses search replace response', () => {
			const response = pkbSearchReplaceResponseSchema.parse({
				matchedFiles: 2,
				replacedFiles: 2,
				paths: ['Notes/a.md', 'Notes/b.md'],
			});
			expect(response.matchedFiles).toBe(2);
		});

		it('parses vault config with templatesFolder', () => {
			const detail = pkbVaultDetailSchema.parse({
				id: 1,
				name: 'Vault',
				slug: 'vault',
				root_path: 'home://Vaults/vault/',
				is_personal: true,
				is_owner: true,
				index_version: 0,
				index_stale: false,
				config: {
					version: 1,
					created_at: '2026-08-17T11:00:00+00:00',
					name: 'Vault',
					defaultNoteFolder: 'Notes',
					templatesFolder: 'Templates',
					attachmentFolder: 'attachments',
					dailyNotes: { enabled: false, format: 'YYYY-MM-DD', folder: 'Daily' },
					wikilink: { caseSensitive: false, extension: '.md' },
				},
			});
			expect(detail.config?.templatesFolder).toBe('Templates');
		});
	});
});
