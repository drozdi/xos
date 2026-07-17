import { api } from '@inccom/shared/api';

import type { PaginatedResponse } from '@inccom/shared/types';

import type { ApiTransaction } from '@inccom/shared/types/api';

import type {

	ITransaction,

	ITransactionFilters,

	ITransactionPayload,

} from '../model/types';



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



export interface IRequestTransactionList

	extends Partial<IRequestList>,

		ITransactionFilters {}



function mapTransactionPayload(

	data: Partial<ITransactionPayload>,

): Record<string, unknown> {

	const payload: Record<string, unknown> = {};



	for (const key of [

		'type',

		'accountId',

		'date',

		'categoryId',

		'comment',

		'amount',

		'isManualAmount',

		'fn',

		'fpd',

		'fp',

		'fd',

		'mcc',

	] as const) {

		if (data[key] !== undefined) {

			payload[key] = data[key];

		}

	}



	if (data.items !== undefined) {

		payload['items'] = data.items.map((item) => ({

			itemId: item.itemId,

			quantity: item.quantity,

			price: item.price,

		}));

	}



	return payload;

}



export async function requestTransactionList(

	params: IRequestTransactionList,

): Promise<IResponseList<ITransaction>> {

	const { page, size } = getPageSize(params);

	const queryParams: Record<string, string | number> = {

		page,

		size,

		account: params.accountId,

	};



	if (params.type) queryParams['type'] = params.type;

	if (params.category) queryParams['category'] = params.category;

	if (params.dateFrom) queryParams['dateFrom'] = params.dateFrom;

	if (params.dateTo) queryParams['dateTo'] = params.dateTo;

	if (params.mcc) queryParams['mcc'] = params.mcc;

	if (params.author) queryParams['author'] = params.author;



	const res = await api.get<PaginatedResponse<ApiTransaction>>('/transactions', {

		params: queryParams,

	});

	return toLegacyListResponse(res.data);

}



export async function requestTransactionCreate(

	data: ITransactionPayload,

): Promise<IResponse<ITransaction>> {

	const res = await api.post<ApiTransaction>(

		'/transactions',

		mapTransactionPayload(data),

	);

	return res.data;

}



export async function requestTransactionRead(

	id: ITransaction['id'],

): Promise<IResponse<ITransaction>> {

	const res = await api.get<ApiTransaction>(`/transactions/${id}`);

	return res.data;

}



export async function requestTransactionUpdate(

	id: ITransaction['id'],

	data: Partial<ITransactionPayload>,

): Promise<IResponse<ITransaction>> {

	const res = await api.patch<ApiTransaction>(

		`/transactions/${id}`,

		mapTransactionPayload(data),

	);

	return res.data;

}



export async function requestTransactionDelete(

	id: ITransaction['id'],

): Promise<IResponse<ITransaction>> {

	const existing = await requestTransactionRead(id);

	await api.delete(`/transactions/${id}`);

	return existing;

}

