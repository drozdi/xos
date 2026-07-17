import { api } from '@inccom/shared/api';

import type { PaginatedResponse } from '@inccom/shared/types';

import type { ApiTransfer } from '@inccom/shared/types/api';

import type { ITransferFilters, ITransferPayload } from '../model/types';



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



export interface IRequestTransferList

	extends Partial<IRequestList>,

		ITransferFilters {}



export async function requestTransferList(

	params: IRequestTransferList = {},

): Promise<IResponseList<ITransfer>> {

	const { page, size } = getPageSize(params);

	const queryParams: Record<string, string | number> = { page, size };



	if (params.fromAccount) queryParams['fromAccount'] = params.fromAccount;

	if (params.toAccount) queryParams['toAccount'] = params.toAccount;

	if (params.dateFrom) queryParams['dateFrom'] = params.dateFrom;

	if (params.dateTo) queryParams['dateTo'] = params.dateTo;



	const res = await api.get<PaginatedResponse<ApiTransfer>>('/transfers', {

		params: queryParams,

	});

	return toLegacyListResponse(res.data);

}



export async function requestTransferCreate(

	data: ITransferPayload,

): Promise<IResponse<ITransfer>> {

	const res = await api.post<ApiTransfer>('/transfers', data);

	return res.data;

}



export async function requestTransferRead(

	id: ITransfer['id'],

): Promise<IResponse<ITransfer>> {

	const res = await api.get<ApiTransfer>(`/transfers/${id}`);

	return res.data;

}



export async function requestTransferUpdate(

	id: ITransfer['id'],

	data: Partial<ITransferPayload>,

): Promise<IResponse<ITransfer>> {

	const res = await api.patch<ApiTransfer>(`/transfers/${id}`, data);

	return res.data;

}



export async function requestTransferDelete(

	id: ITransfer['id'],

): Promise<IResponse<ITransfer>> {

	const existing = await requestTransferRead(id);

	await api.delete(`/transfers/${id}`);

	return existing;

}

