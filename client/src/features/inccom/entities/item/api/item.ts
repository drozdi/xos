import { api } from '@inccom/shared/api';
import { parsePaginatedResponse } from '@inccom/shared/api/parse-paginated-response';
import type { PaginatedResponse } from '@inccom/shared/types';
import type { ApiItem } from '@inccom/shared/types/api';
import type { IItemFilters } from '../model/types';



function toLegacyListResponse<T>(

	paginated: PaginatedResponse<T>,

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



export interface IRequestItemList extends Partial<IRequestList>, IItemFilters {}



export async function requestItemList(

	params: IRequestItemList = {},

): Promise<IResponseList<IItem>> {

	const { page, size } = getPageSize(params);

	const queryParams: Record<string, string | number> = { page, size };



	if (params.search) {

		queryParams['search'] = params.search;

	}

	if (params.category) {

		queryParams['category'] = params.category;

	}



	const res = await api.get<unknown>('/items', {
		params: queryParams,
	});
	const paginated = parsePaginatedResponse(res.data, (item) => item as IItem);
	return toLegacyListResponse(paginated);

}



export async function requestItemCreate(

	data: Partial<IItem>,

): Promise<IResponse<IItem>> {

	const res = await api.post<ApiItem>('/items', {

		name: data.name,

		description: data.description ?? null,

		unit: data.unit ?? null,

		categoryIds: data.categoryIds ?? [],

	});

	return res.data;

}



export async function requestItemRead(

	id: IItem['id'],

): Promise<IResponse<IItem>> {

	const res = await api.get<ApiItem>(`/items/${id}`);

	return res.data;

}



export async function requestItemUpdate(

	id: IItem['id'],

	data: Partial<IItem>,

): Promise<IResponse<IItem>> {

	const payload: Record<string, unknown> = {};

	if (data.name !== undefined) payload['name'] = data.name;

	if (data.description !== undefined) {

		payload['description'] = data.description;

	}

	if (data.unit !== undefined) payload['unit'] = data.unit;

	if (data.categoryIds !== undefined) {

		payload['categoryIds'] = data.categoryIds;

	}



	const res = await api.patch<ApiItem>(`/items/${id}`, payload);

	return res.data;

}



export async function requestItemDelete(

	id: IItem['id'],

): Promise<IResponse<IItem>> {

	const existing = await requestItemRead(id);

	await api.delete(`/items/${id}`);

	return existing;

}

