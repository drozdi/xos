import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import { parseContentRange } from '@/core/api/endpoints/main';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

const listRequestDefaults: ListRequest = {
	t: 'list',
	limit: -1,
	offset: 1,
	filters: {},
};

async function postList<T>(
	path: string,
	request: ListRequest,
	schema: z.ZodType<T[]>,
): Promise<PaginatedResponse<T>> {
	const payload = { ...listRequestDefaults, ...request };
	const { data, headers } = await apiClient.post<unknown>(path, payload);
	const items = schema.parse(data);
	const total = parseContentRange(headers['content-range'] as string | undefined);

	return {
		items,
		total: total || items.length,
		page: payload.offset ?? 1,
		perPage: payload.limit ?? 50,
	};
}

async function getDetail<T>(path: string, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.get<unknown>(path);
	return schema.parse(data);
}

async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
	const { data } = await apiClient.post<unknown>(path, body);
	return schema.parse(data);
}

const optionSchema = z.object({
	value: z.union([z.number(), z.string()]),
	text: z.string().optional(),
	graduates: z.boolean().optional(),
});

const subjectOptionSchema = optionSchema.extend({
	users: z
		.array(
			z.object({
				value: z.union([z.number(), z.string()]),
				text: z.string().optional(),
			}),
		)
		.optional()
		.default([]),
});

export const subjectListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	sort: z.number().nullable().optional(),
});

const subjectUserSchema = z.object({
	user_id: z.number(),
	name: z.string().optional(),
});

export const subjectDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		users: z
			.union([z.array(subjectUserSchema), z.record(z.string(), subjectUserSchema)])
			.optional()
			.transform((value) => {
				if (!value) {
					return [];
				}
				if (Array.isArray(value)) {
					return value;
				}
				return Object.values(value);
			}),
	})
	.passthrough();

export const classListItemSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	tutor: z.string().nullable().optional().transform((v) => v ?? ''),
	graduated: z.boolean().optional(),
	graduated_year: z.number().nullable().optional(),
	should_graduate: z.boolean().optional(),
	transition: z.enum(['graduate', 'promote', 'graduated']).optional(),
	parent_id: z.number().nullable().optional(),
	parent_name: z.string().nullable().optional(),
});

const classUserSchema = z.object({
	id: z.number().optional(),
	user_id: z.number(),
	group_id: z.number().optional(),
	name: z.string().optional(),
});

const classSubSchema = z.object({
	id: z.number(),
	group_id: z.number().optional(),
	name: z.string().nullable().optional(),
	parent_id: z.number().optional(),
	user_id: z.number().nullable().optional(),
	subject_id: z.number().nullable().optional(),
	subject_name: z.string().nullable().optional(),
	users: z.array(classUserSchema).optional(),
});

export const classDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		parent_id: z.number().nullable().optional(),
		user_id: z.number().nullable().optional(),
		graduated: z.boolean().optional(),
		graduated_year: z.number().nullable().optional(),
		users: z.array(classUserSchema).optional(),
		sub: z.array(classSubSchema).optional(),
	})
	.passthrough();

export const parallelDetailSchema = z
	.object({
		id: z.number(),
		name: z.string().nullable().optional(),
		sort: z.number().nullable().optional(),
		graduates: z.boolean().optional(),
		sub: z.array(classSubSchema).optional(),
	})
	.passthrough();

export const lessonTemplateSchema = z.object({
	lesson_number: z.number(),
	start: z.string(),
	end: z.string(),
});

export const calendarClassSchema = z.object({
	id: z.number(),
	name: z.string(),
	teacher: z.string().nullable().optional(),
	can_edit: z.boolean().optional(),
});

export const calendarClassInfoSchema = z.object({
	name: z.string(),
	teacher: z.string().nullable().optional(),
});

export const calendarEventSchema = z.object({
	id: z.number(),
	name: z.string().nullable().optional().transform((v) => v ?? ''),
	start: z.string(),
	end: z.string(),
	color: z.string().optional(),
	files: z
		.union([z.record(z.string(), z.string()), z.array(z.unknown())])
		.optional()
		.transform((value) => {
			if (!value || Array.isArray(value)) {
				return undefined;
			}
			return value;
		}),
});

export const calendarRangeSchema = z.object({
	start: z.string(),
	end: z.string(),
});

export const studentEventDetailSchema = z.object({
	subject: z.string().nullable().optional(),
	start: z.string().nullable().optional(),
	end: z.string().nullable().optional(),
	theme: z.string().nullable().optional(),
	teacher: z.string().nullable().optional(),
	email: z.string().nullable().optional(),
	ht: z.string().nullable().optional(),
	des: z.string().nullable().optional(),
	pt: z.string().nullable().optional(),
	net: z.array(z.string()).optional(),
	files: z.record(z.string(), z.string()).optional(),
});

export const editorEventDetailSchema = z.object({
	user_id: z.number().nullable().optional(),
	class_id: z.number().nullable().optional(),
	group_id: z.number().nullable().optional(),
	subject_id: z.number().nullable().optional(),
	start: z.string(),
	end: z.string(),
	lesson_number: z.number().nullable().optional(),
	repeat_until: z.string().nullable().optional(),
});

export const teacherEventDetailSchema = z.object({
	theme: z.string().nullable().optional(),
	ht: z.string().nullable().optional(),
	pt: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	netResource: z.string().nullable().optional(),
	files: z
		.array(
			z.object({
				id: z.number(),
				name: z.string(),
				src: z.string().optional(),
			}),
		)
		.optional(),
});

export const teacherFileSchema = z.object({
	id: z.number(),
	name: z.string(),
	src: z.string().optional(),
});

export type ParallelDetail = z.infer<typeof parallelDetailSchema>;
export type LessonTemplate = z.infer<typeof lessonTemplateSchema>;
export type SubjectDetail = z.infer<typeof subjectDetailSchema>;
export type ClassDetail = z.infer<typeof classDetailSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarRange = z.infer<typeof calendarRangeSchema>;
export type StudentEventDetail = z.infer<typeof studentEventDetailSchema>;
export type EditorEventDetail = z.infer<typeof editorEventDetailSchema>;
export type TeacherEventDetail = z.infer<typeof teacherEventDetailSchema>;
export type ClassSubGroup = z.infer<typeof classSubSchema>;

export interface EditorEventPayload {
	id?: number;
	class_id?: number;
	group_id?: number | null;
	user_id?: number | null;
	subject_id?: number | null;
	start?: string;
	end?: string;
	lesson_number?: number | null;
	repeat_until?: string | null;
	repeate?: string | null;
	editType?: 'one' | 'after' | 'all';
}

export interface TeacherEventSavePayload {
	id: number;
	theme?: string;
	ht?: string;
	pt?: string;
	description?: string;
	netResource?: string;
	files?: number[];
}

const BASE = '/api/schooltask';

export const schooltaskSubjectApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/subjects/list`, request, z.array(subjectListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/subjects/${id}`, subjectDetailSchema),
	create: async (body: SubjectDetail): Promise<number> => {
		const { data } = await apiClient.post<unknown>(`${BASE}/subjects/`, body);
		return subjectDetailSchema.parse(data).id;
	},
	update: async (id: number, body: SubjectDetail): Promise<number> => {
		const { data } = await apiClient.put<unknown>(`${BASE}/subjects/${id}`, body);
		return subjectDetailSchema.parse(data).id;
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/subjects/${id}`);
	},
	teachersOptions: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/subjects/teachers/options`);
		return z.array(optionSchema).parse(data);
	},
};

export const schooltaskClassApi = {
	list: (request: ListRequest) =>
		postList(`${BASE}/classes/list`, request, z.array(classListItemSchema)),
	get: (id: number) => getDetail(`${BASE}/classes/${id}`, classDetailSchema),
	create: async (body: ClassDetail): Promise<number> => {
		const { data } = await apiClient.post<unknown>(`${BASE}/classes`, body);
		return classDetailSchema.parse(data).id;
	},
	update: async (id: number, body: ClassDetail): Promise<number> => {
		const { data } = await apiClient.put<unknown>(`${BASE}/classes/${id}`, body);
		return classDetailSchema.parse(data).id;
	},
	remove: async (id: number): Promise<void> => {
		await apiClient.delete(`${BASE}/classes/${id}`);
	},
	parallelsOptions: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/classes/parallels/options`);
		return z.array(optionSchema).parse(data);
	},
	subjectsOptions: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/classes/subjects/options`);
		return z.array(subjectOptionSchema).parse(data);
	},
	tutorsOptions: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/classes/tutors/options`);
		return z.array(optionSchema).parse(data);
	},
	pupilsOptions: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/classes/pupils/options`);
		return z.array(optionSchema).parse(data);
	},
	promote: (id: number) => postJson(`${BASE}/classes/${id}/promote`, {}, classDetailSchema),
	graduate: (id: number) => postJson(`${BASE}/classes/${id}/graduate`, {}, classDetailSchema),
	promoteAll: () =>
		postJson(
			`${BASE}/classes/promote-all`,
			{},
			z.object({
				total: z.number(),
				promoted: z.number(),
				graduated: z.number(),
			}),
		),
};

export const schooltaskParallelApi = {
	list: () => postJson(`${BASE}/parallels/list`, {}, z.array(parallelDetailSchema)),
	get: (id: number) => getDetail(`${BASE}/parallels/${id}`, parallelDetailSchema),
	create: async (body: { name: string; sort?: number; code?: string; graduates?: boolean }): Promise<ParallelDetail> => {
		const { data } = await apiClient.post<unknown>(`${BASE}/parallels`, body);
		return parallelDetailSchema.parse(data);
	},
	update: (id: number, body: ParallelDetail) =>
		apiClient.put(`${BASE}/parallels/${id}`, body).then((response) => parallelDetailSchema.parse(response.data)),
	promote: (id: number) => postJson(`${BASE}/parallels/${id}/promote`, {}, parallelDetailSchema),
	graduate: (id: number) => postJson(`${BASE}/parallels/${id}/graduate`, {}, parallelDetailSchema),
};

export const schooltaskMemberApi = {
	sync: async (groupId: number, users: Array<{ id?: number; user_id: number }>) => {
		const { data } = await apiClient.post<unknown>(`${BASE}/members/sync`, {
			group_id: groupId,
			users,
		});
		return z.object({ id: z.number() }).parse(data);
	},
};

export const schooltaskCalendarApi = {
	listClasses: () =>
		postJson(`${BASE}/calendar/classes`, {}, z.array(calendarClassSchema)),
	lessonTemplates: async () => {
		const { data } = await apiClient.get<unknown>(`${BASE}/calendar/lesson-templates`);
		return z.array(lessonTemplateSchema).parse(data);
	},
	classInfo: (classId: number) =>
		postJson(`${BASE}/calendar/${classId}/info`, {}, calendarClassInfoSchema),
	studentEvents: (classId: number, range: CalendarRange) =>
		postJson(
			`${BASE}/calendar/${classId}/student/events`,
			range,
			z.array(calendarEventSchema),
		),
	studentEventDetail: (classId: number, id: number) =>
		getDetail(`${BASE}/calendar/${classId}/student/events/${id}`, studentEventDetailSchema),
	editorEvents: (classId: number, range: CalendarRange) =>
		postJson(
			`${BASE}/calendar/${classId}/editor/events`,
			range,
			z.array(calendarEventSchema),
		),
	editorSubgroups: (classId: number) =>
		postJson(`${BASE}/calendar/${classId}/editor/subgroups`, {}, z.array(optionSchema)),
	editorTeachers: (classId: number, subjectId: number) =>
		postJson(
			`${BASE}/calendar/${classId}/editor/teachers`,
			{ subject_id: subjectId },
			z.array(optionSchema),
		),
	editorAdd: (classId: number, payload: EditorEventPayload) =>
		postJson(`${BASE}/calendar/${classId}/editor/events/add`, payload, z.record(z.string(), z.unknown())),
	editorEdit: (classId: number, payload: EditorEventPayload) =>
		postJson(`${BASE}/calendar/${classId}/editor/events/edit`, payload, z.record(z.string(), z.unknown())),
	editorRemove: (classId: number, payload: EditorEventPayload) =>
		postJson(`${BASE}/calendar/${classId}/editor/events/remove`, payload, z.array(z.unknown())),
	editorDetail: (classId: number, id: number) =>
		postJson(`${BASE}/calendar/${classId}/editor/events/${id}`, {}, editorEventDetailSchema),
	teacherEvents: (range: CalendarRange) =>
		postJson(`${BASE}/calendar/teacher/events`, range, z.array(calendarEventSchema)),
	teacherEventDetail: (id: number) =>
		postJson(`${BASE}/calendar/teacher/events/${id}`, {}, teacherEventDetailSchema),
	teacherFiles: () => postJson(`${BASE}/calendar/teacher/files`, {}, z.array(teacherFileSchema)),
	teacherFilesUpload: async (files: File[]) => {
		const formData = new FormData();
		for (const file of files) {
			formData.append('files[]', file);
		}
		const { data } = await apiClient.post<unknown>(`${BASE}/calendar/teacher/files/upload`, formData);
		return z.array(teacherFileSchema).parse(data);
	},
	teacherFilesImport: async (path: string) => {
		const { data } = await apiClient.post<unknown>(`${BASE}/calendar/teacher/files/import`, { path });
		return teacherFileSchema.parse(data);
	},
	teacherSave: async (payload: TeacherEventSavePayload, newFiles: File[] = []): Promise<void> => {
		const formData = new FormData();
		for (const [key, value] of Object.entries(payload)) {
			if (key === 'files' && Array.isArray(value)) {
				for (const fileId of value) {
					formData.append('event[files][]', String(fileId));
				}
				continue;
			}
			if (value !== undefined && value !== null) {
				formData.append(`event[${key}]`, String(value));
			}
		}
		for (const file of newFiles) {
			formData.append('files[]', file);
		}
		await apiClient.post(`${BASE}/calendar/teacher/events/save`, formData);
	},
};

export const schooltaskEndpoints = {
	base: BASE,
} as const;
