import { api } from '@inccom/shared/api';
import { parsePaginatedResponse } from '@inccom/shared/api/parse-paginated-response';
import type { ApiItemCategory } from '@inccom/shared/types/api';
import type { IItemCategoryFilters } from '../model/types';

function toLegacyListResponse<T>(
	paginated: {
		items: T[];
		total: number;
		page: number;
		size: number;
		pages: number;
	},
): IResponseList<T> {
	return {
		items: paginated.items,
		countItems: paginated.items.length,
		totalItems: paginated.total,
		limit: paginated.size,
		offset: paginated.page - 1,
		next: paginated.page < paginated.pages ? paginated.page + 1 : 0,
		prev: paginated.page > 1 ? paginated.page - 1 : 0,
		total: paginated.total,
	};
}

function getPageSize(params: Partial<IRequestList>): {
	page: number;
	size: number;
} {
	const size = params.limit ?? 100;
	const page = (params.offset ?? 0) + 1;
	return { page, size };
}

export interface IRequestItemCategoryList
	extends Partial<IRequestList>,
		IItemCategoryFilters {}

export async function requestItemCategoryList(
	params: IRequestItemCategoryList = {},
): Promise<IResponseList<IItemCategory>> {
	const { page, size } = getPageSize(params);
	const queryParams: Record<string, string | number> = { page, size };

	if (params.search) {
		queryParams['search'] = params.search;
	}
	if (params.parent !== undefined && params.parent !== null) {
		queryParams['parent'] =
			params.parent === 'null' ? 'null' : params.parent;
	}

	const res = await api.get<unknown>('/item-categories', {
		params: queryParams,
	});
	const paginated = parsePaginatedResponse(res.data, (item) => item as IItemCategory);
	return toLegacyListResponse(paginated);
}

export async function requestItemCategoryCreate(
	data: Partial<IItemCategory>,
): Promise<IResponse<IItemCategory>> {
	const res = await api.post<ApiItemCategory>('/item-categories', {
		name: data.name,
		parentId: data.parentId ?? null,
		keywords: data.keywords ?? [],
	});
	return res.data;
}

export async function requestItemCategoryRead(
	id: IItemCategory['id'],
): Promise<IResponse<IItemCategory>> {
	const res = await api.get<ApiItemCategory>(`/item-categories/${id}`);
	return res.data;
}

export async function requestItemCategoryUpdate(
	id: IItemCategory['id'],
	data: Partial<IItemCategory>,
): Promise<IResponse<IItemCategory>> {
	const payload: Record<string, unknown> = {};
	if (data.name !== undefined) payload['name'] = data.name;
	if (data.parentId !== undefined) payload['parentId'] = data.parentId;
	if (data.keywords !== undefined) payload['keywords'] = data.keywords;

	const res = await api.patch<ApiItemCategory>(
		`/item-categories/${id}`,
		payload,
	);
	return res.data;
}

export async function requestItemCategoryDelete(
	id: IItemCategory['id'],
): Promise<IResponse<IItemCategory>> {
	const existing = await requestItemCategoryRead(id);
	await api.delete(`/item-categories/${id}`);
	return existing;
}
