import { describe, expect, it } from 'vitest';



import {

	boardCardSchema,

	boardDetailSchema,

	boardFilterResponseSchema,

	boardLabelSchema,

	boardListSchema,

	boardSummarySchema,

	cardDetailSchema,

	checklistSchema,

	commentSchema,

	attachmentSchema,

	workspaceDetailSchema,

	workspaceSummarySchema,

} from '@/core/api/endpoints/boardApi';



describe('board endpoints', () => {

	describe('workspaceSummarySchema', () => {

		it('parses workspace summary', () => {

			const workspace = workspaceSummarySchema.parse({

				id: 1,

				name: 'Main workspace',

				description: 'Team boards',

				is_owner: true,

				role: 'owner',

				owner: { id: 5, email: 'owner@example.com', alias: 'Owner' },

				boards_count: 3,

				updated_at: '2026-08-17 12:00:00',

			});



			expect(workspace.name).toBe('Main workspace');

			expect(workspace.boards_count).toBe(3);

			expect(workspace.is_owner).toBe(true);

		});



		it('defaults boards_count to 0', () => {

			const workspace = workspaceSummarySchema.parse({

				id: 2,

				name: 'Empty',

				is_owner: false,

			});



			expect(workspace.boards_count).toBe(0);

		});

	});



	describe('workspaceDetailSchema', () => {

		it('parses workspace detail with boards and permissions', () => {

			const workspace = workspaceDetailSchema.parse({

				id: 1,

				name: 'Main',

				is_owner: true,

				boards: [

					{

						id: 10,

						workspace_id: 1,

						title: 'Sprint',

						background: { type: 'color', value: '#fff' },

						visibility: 'private',

					},

				],

				members: [

					{

						user_id: 1,

						email: 'owner@example.com',

						role: 'owner',

						is_owner: true,

					},

				],

				permissions: {

					can_edit: true,

					can_manage_members: true,

					can_create_board: true,

					can_delete: true,

				},

			});



			expect(workspace.boards).toHaveLength(1);

			expect(workspace.permissions.can_create_board).toBe(true);

		});

	});



	describe('boardSummarySchema', () => {

		it('parses board summary', () => {

			const board = boardSummarySchema.parse({

				id: 10,

				title: 'Sprint board',

				workspace_id: 1,

				description: 'Q3 sprint',

				background: { type: 'color', value: '#ffffff' },

				visibility: 'workspace',

				role: 'editor',

				updated_at: '2026-08-17 12:00:00',

			});



			expect(board.title).toBe('Sprint board');

			expect(board.workspace_id).toBe(1);

			expect(board.visibility).toBe('workspace');

		});

	});



	describe('boardLabelSchema', () => {

		it('parses label', () => {

			const label = boardLabelSchema.parse({

				id: 1,

				name: 'Bug',

				color: '#eb5a46',

			});



			expect(label.name).toBe('Bug');

			expect(label.color).toBe('#eb5a46');

		});

	});



	describe('boardCardSchema', () => {

		it('parses card summary fields from board detail', () => {

			const card = boardCardSchema.parse({

				id: 100,

				title: 'Fix login',

				position: 1024,

				due_date: '2026-08-20T00:00:00',

				label_ids: [1],

				assignee_ids: [5],

				checklist_progress: { total: 3, checked: 1 },

			});



			expect(card.title).toBe('Fix login');

			expect(card.label_ids).toEqual([1]);

			expect(card.checklist_progress?.checked).toBe(1);

		});

	});



	describe('boardListSchema', () => {

		it('parses list with assignee and cards', () => {

			const list = boardListSchema.parse({

				id: 10,

				title: 'To Do',

				order_index: 1024,

				assignee: { id: 5, alias: 'Dev' },

				cards: [

					{

						id: 100,

						title: 'Task',

						position: 1024,

						label_ids: [],

						assignee_ids: [],

					},

				],

			});



			expect(list.title).toBe('To Do');

			expect(list.assignee?.id).toBe(5);

			expect(list.cards).toHaveLength(1);

		});

	});



	describe('boardDetailSchema', () => {

		it('parses board detail with empty lists and permissions', () => {

			const board = boardDetailSchema.parse({

				id: 10,

				title: 'Sprint board',

				workspace_id: 1,

				labels: [],

				lists: [],

				members: [],

				permissions: {

					can_edit: true,

					can_admin: false,

					can_delete: true,

				},

			});



			expect(board.lists).toEqual([]);

			expect(board.permissions.can_edit).toBe(true);

		});



		it('parses full board detail per PLAN §5.11', () => {

			const board = boardDetailSchema.parse({

				id: 1,

				title: 'Sprint 1',

				background: { type: 'color', value: '#0079bf' },

				visibility: 'private',

				labels: [{ id: 1, name: 'Bug', color: '#eb5a46' }],

				lists: [

					{

						id: 10,

						title: 'To Do',

						order_index: 1024,

						assignee: { id: 5, alias: 'Dev' },

						cards: [

							{

								id: 100,

								title: 'Card title',

								position: 1024,

								due_date: '2026-08-20T00:00:00',

								label_ids: [1],

								assignee_ids: [5],

								checklist_progress: { total: 3, checked: 1 },

							},

						],

					},

				],

				members: [{ user_id: 5, email: 'dev@example.com', role: 'editor' }],

				permissions: { can_edit: true, can_admin: false, can_delete: false },

			});



			expect(board.labels[0]?.name).toBe('Bug');

			expect(board.lists[0]?.cards[0]?.title).toBe('Card title');

			expect(board.members).toHaveLength(1);

		});

	});

	describe('cardDetailSchema', () => {

		it('parses card detail with checklists, comments, attachments', () => {

			const card = cardDetailSchema.parse({

				id: 100,

				title: 'Fix login',

				position: 1024,

				list_id: 10,

				board_id: 1,

				description_md: '## Steps\n\n1. Reproduce',

				due_date: '2026-08-20T00:00:00',

				label_ids: [1, 2],

				assignee_ids: [5],

				created_by: { id: 5, alias: 'Dev' },

				created_at: '2026-08-17 12:00:00',

				updated_at: '2026-08-17 13:00:00',

				checklists: [

					{

						id: 1,

						title: 'QA',

						position: 1024,

						items: [

							{ id: 10, text: 'Test login', checked: true, position: 1024 },

							{ id: 11, text: 'Test logout', checked: false, position: 2048 },

						],

					},

				],

				comments: [

					{

						id: 1,

						text: 'Looks good',

						user: { id: 5, alias: 'Dev', email: 'dev@example.com' },

						created_at: '2026-08-17 14:00:00',

					},

				],

				attachments: [

					{

						id: 1,

						file_name: 'screenshot.png',

						file_url: 'board/abc/screenshot.png',

						mime_type: 'image/png',

						size_bytes: 12345,

						uploaded_by: { id: 5, alias: 'Dev' },

						created_at: '2026-08-17 15:00:00',

					},

				],

			});



			expect(card.description_md).toContain('Steps');

			expect(card.checklists).toHaveLength(1);

			expect(card.checklists[0]?.items).toHaveLength(2);

			expect(card.comments[0]?.user.alias).toBe('Dev');

			expect(card.attachments[0]?.file_name).toBe('screenshot.png');

		});

	});

	describe('checklistSchema', () => {

		it('parses checklist with items', () => {

			const checklist = checklistSchema.parse({

				id: 1,

				title: 'Deploy',

				position: 1024,

				items: [{ id: 1, text: 'Build', checked: false, position: 1024 }],

			});

			expect(checklist.items[0]?.text).toBe('Build');

		});

	});

	describe('commentSchema', () => {

		it('parses comment with user ref', () => {

			const comment = commentSchema.parse({

				id: 1,

				text: 'Note',

				user: { id: 3, email: 'u@example.com' },

			});

			expect(comment.user.id).toBe(3);

		});

	});

	describe('attachmentSchema', () => {

		it('parses attachment metadata', () => {

			const attachment = attachmentSchema.parse({

				id: 2,

				file_name: 'doc.pdf',

				file_url: 'board/x/doc.pdf',

				size_bytes: 999,

			});

			expect(attachment.file_name).toBe('doc.pdf');

		});

	});

	describe('assignee and label payloads', () => {

		it('parses card with assignee_ids and label_ids arrays', () => {

			const card = boardCardSchema.parse({

				id: 1,

				title: 'Task',

				position: 1024,

				assignee_ids: [5, 7],

				label_ids: [1, 3],

			});

			expect(card.assignee_ids).toEqual([5, 7]);

			expect(card.label_ids).toEqual([1, 3]);

		});

		it('defaults empty assignee_ids and label_ids', () => {

			const card = boardCardSchema.parse({

				id: 2,

				title: 'Empty',

				position: 2048,

			});

			expect(card.assignee_ids).toEqual([]);

			expect(card.label_ids).toEqual([]);

		});

	});

	describe('boardFilterResponseSchema', () => {
		it('parses filter response', () => {
			const response = boardFilterResponseSchema.parse({
				card_ids: [1, 2],
				filtered: true,
			});
			expect(response.filtered).toBe(true);
			expect(response.card_ids).toHaveLength(2);
		});
	});
});


