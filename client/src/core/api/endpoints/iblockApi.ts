import { z } from 'zod';

import { apiClient } from '@/core/api/client';
import {
	createEntity,
	getDetail,
	postList,
	removeEntity,
	updateEntity,
} from '@/core/api/crudHelpers';
import type { ListRequest, PaginatedResponse } from '@/types/api.types';

const nullableString = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((v) => v ?? '');

const nullableNumber = z
	.union([z.number(), z.null(), z.undefined()])
	.transform((v) => (v == null ? null : v));

const nullableBool = z
	.union([z.boolean(), z.null(), z.undefined()])
	.transform((v) => Boolean(v));

export const iblockTypeListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
});

export const iblockTypeDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	description: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	sections: nullableBool,
	active_from: nullableString,
	active_to: nullableString,
	parent_id: nullableNumber,
	x_timestamp: nullableString,
});

export const iblockBlockListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	type_id: nullableNumber,
});

export const iblockBlockDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	description: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	sections: nullableBool,
	property: nullableBool,
	section_mode: nullableString,
	active_from: nullableString,
	active_to: nullableString,
	type_id: nullableNumber,
	x_timestamp: nullableString,
	date_created: nullableString,
});

export const iblockSectionListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	level: z.number().nullable().optional().transform((v) => v ?? 0),
	block_id: nullableNumber,
});

export const iblockSectionDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	description: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	level: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	active_from: nullableString,
	active_to: nullableString,
	block_id: nullableNumber,
	parent_id: nullableNumber,
	element_filter: z.record(z.string(), z.unknown()).nullable().optional().transform((v) => v ?? null),
	inherited_element_filter: z.record(z.string(), z.unknown()).nullable().optional().transform((v) => v ?? null),
	x_timestamp: nullableString,
	date_created: nullableString,
});

export const iblockElementListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	block_id: nullableNumber,
	section_id: nullableNumber,
	section_ids: z.array(z.number()).optional().default([]),
});

const propertyValueItemSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.null(),
	z.object({
		id: z.number(),
		name: z.string().optional(),
		code: z.string().optional().nullable(),
		src: z.string().optional(),
	}),
]);
const propertyValueSchema = z.union([propertyValueItemSchema, z.array(propertyValueItemSchema)]);

export const iblockElementDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	description: nullableString,
	preview_text: nullableString,
	detail_text: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	active_from: nullableString,
	active_to: nullableString,
	block_id: nullableNumber,
	section_id: nullableNumber,
	section_ids: z.array(z.number()).optional().default([]),
	PROPERTY_VALUES: z.record(z.string(), propertyValueSchema).optional().default({}),
	x_timestamp: nullableString,
	date_created: nullableString,
});

export const iblockPropertyListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	block_id: nullableNumber,
	field_type: nullableString,
	link_iblock_id: nullableNumber,
});

export const iblockPropertyDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	description: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	required: nullableBool,
	multiple: nullableBool,
	field_type: nullableString,
	list_type: nullableString,
	default_value: nullableString,
	postfix: nullableString,
	prefix: nullableString,
	active_from: nullableString,
	active_to: nullableString,
	block_id: nullableNumber,
	parent_id: nullableNumber,
	link_iblock_id: nullableNumber,
	x_timestamp: nullableString,
	date_created: nullableString,
});

export const iblockPropertyEnumListItemSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	default: nullableBool,
	property_id: nullableNumber,
});

export const iblockPropertyEnumDetailSchema = z.object({
	id: z.number(),
	code: nullableString,
	name: nullableString,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	default: nullableBool,
	property_id: nullableNumber,
	x_timestamp: nullableString,
});

export const iblockSectionPropertyListItemSchema = z.object({
	id: z.number(),
	section_id: nullableNumber,
	property_id: nullableNumber,
	block_id: nullableNumber,
	smart_filter: nullableBool,
	display_type: nullableString,
	display_expanded: nullableBool,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
});

export const iblockSectionPropertyDetailSchema = z.object({
	id: z.number(),
	section_id: nullableNumber,
	property_id: nullableNumber,
	block_id: nullableNumber,
	smart_filter: nullableBool,
	display_type: nullableString,
	display_expanded: nullableBool,
	sort: z.number().nullable().optional().transform((v) => v ?? 0),
	active: nullableBool,
	property_code: nullableString,
	property_name: nullableString,
	field_type: nullableString,
});

export type IblockTypeListItem = z.infer<typeof iblockTypeListItemSchema>;
export type IblockTypeDetail = z.infer<typeof iblockTypeDetailSchema>;
export type IblockBlockListItem = z.infer<typeof iblockBlockListItemSchema>;
export type IblockBlockDetail = z.infer<typeof iblockBlockDetailSchema>;
export type IblockSectionListItem = z.infer<typeof iblockSectionListItemSchema>;
export type IblockSectionDetail = z.infer<typeof iblockSectionDetailSchema>;
export type IblockElementListItem = z.infer<typeof iblockElementListItemSchema>;
export type IblockElementDetail = z.infer<typeof iblockElementDetailSchema>;
export type IblockPropertyListItem = z.infer<typeof iblockPropertyListItemSchema>;
export type IblockPropertyDetail = z.infer<typeof iblockPropertyDetailSchema>;
export type IblockPropertyEnumListItem = z.infer<typeof iblockPropertyEnumListItemSchema>;
export type IblockPropertyEnumDetail = z.infer<typeof iblockPropertyEnumDetailSchema>;
export type IblockSectionPropertyListItem = z.infer<typeof iblockSectionPropertyListItemSchema>;
export type IblockSectionPropertyDetail = z.infer<typeof iblockSectionPropertyDetailSchema>;

function makeCrudApi<TList, TDetail>(
	basePath: string,
	listSchema: z.ZodType<TList[]>,
	detailSchema: z.ZodType<TDetail>,
) {
	return {
		list: (request: ListRequest): Promise<PaginatedResponse<TList>> =>
			postList(basePath + '/list', request, listSchema),
		get: (id: number): Promise<TDetail> => getDetail(`${basePath}/${id}`, detailSchema),
		create: (body: unknown): Promise<number> => createEntity(basePath, body),
		update: (id: number, body: unknown): Promise<number> => updateEntity(basePath, id, body),
		remove: (id: number): Promise<void> => removeEntity(basePath, id),
	};
}

export const iblockTypeApi = makeCrudApi(
	'/api/iblock/type',
	z.array(iblockTypeListItemSchema),
	iblockTypeDetailSchema,
);

export const iblockBlockApi = makeCrudApi(
	'/api/iblock/block',
	z.array(iblockBlockListItemSchema),
	iblockBlockDetailSchema,
);

export const iblockSectionApi = {
	...makeCrudApi(
		'/api/iblock/section',
		z.array(iblockSectionListItemSchema),
		iblockSectionDetailSchema,
	),
	filter: async (id: number): Promise<IblockSectionPropertyDetail[]> => {
		const { data } = await apiClient.get<unknown>(`/api/iblock/section/${id}/filter`);
		return z.array(iblockSectionPropertyDetailSchema).parse(data);
	},
	elements: (id: number, request: ListRequest): Promise<PaginatedResponse<IblockElementListItem>> =>
		postList(`/api/iblock/section/${id}/elements`, request, z.array(iblockElementListItemSchema)),
};

export const iblockElementApi = makeCrudApi(
	'/api/iblock/element',
	z.array(iblockElementListItemSchema),
	iblockElementDetailSchema,
);

export const iblockPropertyApi = makeCrudApi(
	'/api/iblock/property',
	z.array(iblockPropertyListItemSchema),
	iblockPropertyDetailSchema,
);

export const iblockPropertyEnumApi = makeCrudApi(
	'/api/iblock/property-enum',
	z.array(iblockPropertyEnumListItemSchema),
	iblockPropertyEnumDetailSchema,
);

export const iblockSectionPropertyApi = makeCrudApi(
	'/api/iblock/section-property',
	z.array(iblockSectionPropertyListItemSchema),
	iblockSectionPropertyDetailSchema,
);

export async function uploadIblockFile(file: File): Promise<{ id: number; name: string; src: string }> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('module', 'iblock');
	const { data } = await apiClient.post<unknown>('/api/main/file/upload', formData);
	const parsed = z.array(z.object({ id: z.number(), name: z.string(), src: z.string() })).parse(data);
	if (!parsed[0]) throw new Error('Upload failed');
	return parsed[0];
}

export const iblockEndpoints = {
	type: iblockTypeApi,
	block: iblockBlockApi,
	section: iblockSectionApi,
	element: iblockElementApi,
	property: iblockPropertyApi,
	propertyEnum: iblockPropertyEnumApi,
	sectionProperty: iblockSectionPropertyApi,
};
