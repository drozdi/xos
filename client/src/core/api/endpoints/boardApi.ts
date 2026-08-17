import { z } from 'zod';



import { apiClient } from '@/core/api/client';

import { getDetail } from '@/core/api/crudHelpers';



const BASE = '/api/board';



const userRefSchema = z.object({

	id: z.number().nullable().optional(),

	email: z.string().nullable().optional(),

	alias: z.string().nullable().optional(),

});



const memberRoleSchema = z.enum(['owner', 'admin', 'editor', 'observer']);



const workspaceMemberSchema = z.object({

	user_id: z.number().nullable().optional(),

	email: z.string().nullable().optional(),

	alias: z.string().nullable().optional(),

	role: memberRoleSchema,

	is_owner: z.boolean().optional(),

});



const boardMemberSchema = z.object({

	user_id: z.number().nullable().optional(),

	email: z.string().nullable().optional(),

	alias: z.string().nullable().optional(),

	role: memberRoleSchema,

});



const backgroundSchema = z.object({

	type: z.enum(['color', 'image', 'gradient']),

	value: z.string(),

});



const visibilitySchema = z.enum(['private', 'workspace']);



const workspacePermissionsSchema = z.object({

	can_edit: z.boolean(),

	can_manage_members: z.boolean(),

	can_create_board: z.boolean(),

});



const boardPermissionsSchema = z.object({

	can_edit: z.boolean(),

	can_admin: z.boolean(),

});



const checklistProgressSchema = z.object({

	total: z.number(),

	checked: z.number(),

});



export const boardLabelSchema = z.object({

	id: z.number(),

	name: z.string(),

	color: z.string(),

});



export const boardCardSchema = z.object({

	id: z.number(),

	title: z.string(),

	position: z.number(),

	due_date: z.string().nullable().optional(),

	cover_color: z.string().nullable().optional(),

	label_ids: z.array(z.number()).default([]),

	assignee_ids: z.array(z.number()).default([]),

	checklist_progress: checklistProgressSchema.optional(),

	list_id: z.number().nullable().optional(),

	board_id: z.number().nullable().optional(),

	description_md: z.string().nullable().optional(),

	created_by: userRefSchema.optional(),

	created_at: z.string().nullable().optional(),

	updated_at: z.string().nullable().optional(),

});



export const boardListSchema = z.object({

	id: z.number(),

	title: z.string(),

	order_index: z.number(),

	assignee: userRefSchema.optional(),

	cards: z.array(boardCardSchema).default([]),

});



export const workspaceSummarySchema = z.object({

	id: z.number(),

	name: z.string(),

	description: z.string().nullable().optional(),

	is_owner: z.boolean(),

	role: memberRoleSchema.nullable().optional(),

	owner: userRefSchema.optional(),

	boards_count: z.number().optional().default(0),

	updated_at: z.string().nullable().optional(),

});



export const boardSummarySchema = z.object({

	id: z.number(),

	workspace_id: z.number().nullable().optional(),

	title: z.string(),

	description: z.string().nullable().optional(),

	background: backgroundSchema.optional(),

	visibility: visibilitySchema.optional(),

	role: memberRoleSchema.nullable().optional(),

	updated_at: z.string().nullable().optional(),

});



export const workspaceDetailSchema = workspaceSummarySchema.extend({

	boards: z.array(boardSummarySchema).default([]),

	members: z.array(workspaceMemberSchema).default([]),

	permissions: workspacePermissionsSchema,

	created_at: z.string().nullable().optional(),

});



export const boardDetailSchema = boardSummarySchema.extend({

	labels: z.array(boardLabelSchema).default([]),

	lists: z.array(boardListSchema).default([]),

	members: z.array(boardMemberSchema).default([]),

	permissions: boardPermissionsSchema,

	created_at: z.string().nullable().optional(),

});



export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;

export type WorkspaceDetail = z.infer<typeof workspaceDetailSchema>;

export type BoardSummary = z.infer<typeof boardSummarySchema>;

export type BoardDetail = z.infer<typeof boardDetailSchema>;

export type BoardVisibility = z.infer<typeof visibilitySchema>;

export type BoardLabel = z.infer<typeof boardLabelSchema>;

export type BoardCard = z.infer<typeof boardCardSchema>;

export type BoardList = z.infer<typeof boardListSchema>;

export type BoardMember = z.infer<typeof boardMemberSchema>;



export type WorkspaceWritePayload = {

	name?: string;

	description?: string | null;

};



export type BoardWritePayload = {

	title?: string;

	description?: string | null;

	background_type?: 'color' | 'image' | 'gradient';

	background_value?: string;

	visibility?: BoardVisibility;

};



export type ListWritePayload = {

	title?: string;

	assignee_id?: number | null;

};



export type CardWritePayload = {

	title?: string;

	description_md?: string | null;

	due_date?: string | null;

	cover_color?: string | null;

};



export type LabelWritePayload = {

	name?: string;

	color?: string;

};



export type ListReorderItem = {

	id: number;

	order_index: number;

};



export type CardMovePayload = {

	list_id: number;

	position: number;

};



export const boardFilterResponseSchema = z.object({

	card_ids: z.array(z.number()),

	filtered: z.boolean(),

});



export type BoardFilterParams = {

	assignee?: number[];

	label?: number[];

	due_before?: string;

	due_after?: string;

	q?: string;

};



export type BoardFilterResponse = z.infer<typeof boardFilterResponseSchema>;



export const checklistItemSchema = z.object({

	id: z.number(),

	text: z.string(),

	checked: z.boolean(),

	position: z.number(),

});



export const checklistSchema = z.object({

	id: z.number(),

	title: z.string(),

	position: z.number(),

	items: z.array(checklistItemSchema).default([]),

});



export const commentSchema = z.object({

	id: z.number(),

	text: z.string(),

	user: userRefSchema,

	created_at: z.string().nullable().optional(),

	updated_at: z.string().nullable().optional(),

});



export const attachmentSchema = z.object({

	id: z.number(),

	file_name: z.string(),

	file_url: z.string(),

	mime_type: z.string().nullable().optional(),

	size_bytes: z.number().nullable().optional(),

	uploaded_by: userRefSchema.optional(),

	created_at: z.string().nullable().optional(),

});



export const cardDetailSchema = boardCardSchema.extend({

	checklists: z.array(checklistSchema).default([]),

	comments: z.array(commentSchema).default([]),

	attachments: z.array(attachmentSchema).default([]),

});



export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export type Checklist = z.infer<typeof checklistSchema>;

export type BoardComment = z.infer<typeof commentSchema>;

export type BoardAttachment = z.infer<typeof attachmentSchema>;

export type CardDetail = z.infer<typeof cardDetailSchema>;



export type ChecklistWritePayload = {

	title?: string;

};



export type ChecklistItemWritePayload = {

	text?: string;

	checked?: boolean;

};



export type CommentWritePayload = {

	text?: string;

};



async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {

	const { data } = await apiClient.post<unknown>(path, body);

	return schema.parse(data);

}



async function putJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {

	const { data } = await apiClient.put<unknown>(path, body);

	return schema.parse(data);

}



export const boardApi = {

	workspaces: async (): Promise<WorkspaceSummary[]> => {

		const { data } = await apiClient.get<unknown>(`${BASE}/workspaces`);

		return z.array(workspaceSummarySchema).parse(data);

	},

	workspace: (id: number) => getDetail(`${BASE}/workspaces/${id}`, workspaceDetailSchema),

	createWorkspace: (payload: WorkspaceWritePayload) =>

		postJson(`${BASE}/workspaces`, payload, workspaceDetailSchema),

	updateWorkspace: (id: number, payload: WorkspaceWritePayload) =>

		putJson(`${BASE}/workspaces/${id}`, payload, workspaceDetailSchema),

	removeWorkspace: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/workspaces/${id}`);

	},

	createBoard: (workspaceId: number, payload: BoardWritePayload) =>

		postJson(`${BASE}/workspaces/${workspaceId}/boards`, payload, boardDetailSchema),

	board: (id: number) => getDetail(`${BASE}/boards/${id}`, boardDetailSchema),

	filterCards: async (boardId: number, params: BoardFilterParams): Promise<BoardFilterResponse> => {

		const query: Record<string, string | number | number[]> = {};

		if (params.assignee?.length) {

			query.assignee = params.assignee;

		}

		if (params.label?.length) {

			query.label = params.label;

		}

		if (params.due_before) {

			query.due_before = params.due_before;

		}

		if (params.due_after) {

			query.due_after = params.due_after;

		}

		if (params.q?.trim()) {

			query.q = params.q.trim();

		}

		const { data } = await apiClient.get<unknown>(`${BASE}/boards/${boardId}/cards`, { params: query });

		return boardFilterResponseSchema.parse(data);

	},

	updateBoard: (id: number, payload: BoardWritePayload) =>

		putJson(`${BASE}/boards/${id}`, payload, boardDetailSchema),

	removeBoard: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/boards/${id}`);

	},

	createList: (boardId: number, payload: Pick<ListWritePayload, 'title'>) =>

		postJson(`${BASE}/boards/${boardId}/lists`, payload, boardListSchema),

	updateList: (id: number, payload: ListWritePayload) =>

		putJson(`${BASE}/lists/${id}`, payload, boardListSchema),

	deleteList: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/lists/${id}`);

	},

	reorderLists: (boardId: number, orders: ListReorderItem[]) =>

		putJson(`${BASE}/boards/${boardId}/lists/reorder`, { orders }, boardDetailSchema),

	createCard: (listId: number, payload: Pick<CardWritePayload, 'title'>) =>

		postJson(`${BASE}/lists/${listId}/cards`, payload, boardCardSchema),

	card: (id: number) => getDetail(`${BASE}/cards/${id}`, cardDetailSchema),

	updateCard: (id: number, payload: CardWritePayload) =>

		putJson(`${BASE}/cards/${id}`, payload, cardDetailSchema),

	deleteCard: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/cards/${id}`);

	},

	moveCard: (id: number, payload: CardMovePayload) =>

		putJson(`${BASE}/cards/${id}/move`, payload, cardDetailSchema),

	createChecklist: (cardId: number, payload: Pick<ChecklistWritePayload, 'title'>) =>

		postJson(`${BASE}/cards/${cardId}/checklists`, payload, checklistSchema),

	updateChecklist: (id: number, payload: ChecklistWritePayload) =>

		putJson(`${BASE}/checklists/${id}`, payload, checklistSchema),

	deleteChecklist: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/checklists/${id}`);

	},

	createChecklistItem: (checklistId: number, payload: Pick<ChecklistItemWritePayload, 'text'>) =>

		postJson(`${BASE}/checklists/${checklistId}/items`, payload, checklistItemSchema),

	updateChecklistItem: (id: number, payload: ChecklistItemWritePayload) =>

		putJson(`${BASE}/checklist-items/${id}`, payload, checklistItemSchema),

	deleteChecklistItem: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/checklist-items/${id}`);

	},

	comments: async (cardId: number): Promise<BoardComment[]> => {

		const { data } = await apiClient.get<unknown>(`${BASE}/cards/${cardId}/comments`);

		return z.array(commentSchema).parse(data);

	},

	createComment: (cardId: number, payload: Pick<CommentWritePayload, 'text'>) =>

		postJson(`${BASE}/cards/${cardId}/comments`, payload, commentSchema),

	updateComment: (id: number, payload: CommentWritePayload) =>

		putJson(`${BASE}/comments/${id}`, payload, commentSchema),

	deleteComment: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/comments/${id}`);

	},

	attachments: async (cardId: number): Promise<BoardAttachment[]> => {

		const { data } = await apiClient.get<unknown>(`${BASE}/cards/${cardId}/attachments`);

		return z.array(attachmentSchema).parse(data);

	},

	uploadAttachment: async (cardId: number, file: File): Promise<BoardAttachment> => {

		const formData = new FormData();

		formData.append('attachment', file);

		const { data } = await apiClient.post<unknown>(

			`${BASE}/cards/${cardId}/attachments`,

			formData,

		);

		return attachmentSchema.parse(data);

	},

	deleteAttachment: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/attachments/${id}`);

	},

	setCardAssignees: (id: number, userIds: number[]) =>

		putJson(`${BASE}/cards/${id}/assignees`, { user_ids: userIds }, cardDetailSchema),

	setCardLabels: (id: number, labelIds: number[]) =>

		putJson(`${BASE}/cards/${id}/labels`, { label_ids: labelIds }, cardDetailSchema),

	createLabel: (boardId: number, payload: LabelWritePayload) =>

		postJson(`${BASE}/boards/${boardId}/labels`, payload, boardLabelSchema),

	updateLabel: (id: number, payload: LabelWritePayload) =>

		putJson(`${BASE}/labels/${id}`, payload, boardLabelSchema),

	deleteLabel: async (id: number): Promise<void> => {

		await apiClient.delete(`${BASE}/labels/${id}`);

	},

	listBoardMembers: async (boardId: number): Promise<BoardMember[]> => {

		const { data } = await apiClient.get<unknown>(`${BASE}/boards/${boardId}/members`);

		return z.array(boardMemberSchema).parse(data);

	},

	addBoardMember: (boardId: number, email: string, role: string) =>

		postJson(`${BASE}/boards/${boardId}/members`, { email, role }, z.array(boardMemberSchema)),

	updateBoardMember: (boardId: number, userId: number, role: string) =>

		putJson(`${BASE}/boards/${boardId}/members/${userId}`, { role }, z.array(boardMemberSchema)),

	removeBoardMember: async (boardId: number, userId: number): Promise<BoardMember[]> => {

		const { data } = await apiClient.delete<unknown>(`${BASE}/boards/${boardId}/members/${userId}`);

		return z.array(boardMemberSchema).parse(data);

	},

};


