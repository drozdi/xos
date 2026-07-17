import { requestAccountList } from '@inccom/entities/account/api/account';
import { api } from '@inccom/shared/api';
import { parsePaginatedResponse } from '@inccom/shared/api/parse-paginated-response';
import type { PaginatedResponse } from '@inccom/shared/types';
import type { ApiTransactionCategory } from '@inccom/shared/types/api';
import {
	mapTransactionCategoryFromApi,
	mapTransactionCategoryToApi,
} from '@inccom/shared/types/api';



export interface IRequestCategoryList extends Partial<IRequestList> {

	accountId?: number;

}



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



async function fetchCategoriesForAccount(

	accountId: number,

	params: Partial<IRequestList>,

): Promise<IResponseList<ICategory>> {

	const { page, size } = getPageSize(params);

	const res = await api.get<unknown>(
		`/accounts/${accountId}/categories`,
		{ params: { page, size } },
	);
	const paginated = parsePaginatedResponse(res.data, (item) =>
		mapTransactionCategoryFromApi({
			...(item as ApiTransactionCategory),
			accountId:
				(item as ApiTransactionCategory).accountId ?? accountId,
		}),
	);
	return toLegacyListResponse(paginated);

}



export async function requestCategoryList(

	params: IRequestCategoryList = {},

): Promise<IResponseList<ICategory>> {

	const accountId = params.accountId;

	if (accountId) {

		return fetchCategoriesForAccount(accountId, params);

	}



	const accountsRes = await requestAccountList({ limit: 100, offset: 0 });

	const allCategories: ICategory[] = [];



	for (const account of accountsRes.items) {

		const res = await fetchCategoriesForAccount(account.id, {

			limit: 100,

			offset: 0,

		});

		allCategories.push(...res.items);

	}



	return {

		items: allCategories,

		countItems: allCategories.length,

		totalItems: allCategories.length,

		limit: params.limit ?? 100,

		offset: params.offset ?? 0,

		next: 0,

		prev: 0,

		total: allCategories.length,

	};

}



async function resolveAccountId(

	categoryId: ICategory['id'],

	accountId?: number,

): Promise<number> {

	if (accountId) return accountId;



	const accountsRes = await requestAccountList({ limit: 100, offset: 0 });

	for (const account of accountsRes.items) {

		const res = await fetchCategoriesForAccount(account.id, {

			limit: 100,

			offset: 0,

		});

		if (res.items.some((c) => c.id === categoryId)) {

			return account.id;

		}

	}

	throw new Error(`Category ${categoryId} not found`);

}



export async function requestCategoryCreate({

	id,

	x_timestamp,

	account_id,

	...data

}: Partial<ICategory>): Promise<IResponse<ICategory>> {

	if (!account_id) {

		throw new Error('account_id is required');

	}

	const res = await api.post<ApiTransactionCategory>(

		`/accounts/${account_id}/categories`,

		mapTransactionCategoryToApi(data),

	);

	return mapTransactionCategoryFromApi({ ...res.data, accountId: account_id });

}



export async function requestCategoryRead(

	id: ICategory['id'],

): Promise<IResponse<ICategory>> {

	const accountId = await resolveAccountId(id);

	const res = await fetchCategoriesForAccount(accountId, {

		limit: 100,

		offset: 0,

	});

	const category = res.items.find((c) => c.id === id);

	if (!category) {

		throw new Error(`Category ${id} not found`);

	}

	return category;

}



export async function requestCategoryUpdate(

	id: ICategory['id'],

	{ x_timestamp, account_id, ...data }: Partial<ICategory>,

): Promise<IResponse<ICategory>> {

	const resolvedAccountId = await resolveAccountId(id, account_id);

	const res = await api.patch<ApiTransactionCategory>(

		`/accounts/${resolvedAccountId}/categories/${id}`,

		mapTransactionCategoryToApi(data),

	);

	return mapTransactionCategoryFromApi(res.data);

}



export async function requestCategoryDelete(

	id: ICategory['id'],

): Promise<IResponse<ICategory>> {

	const accountId = await resolveAccountId(id);

	const existing = await requestCategoryRead(id);

	await api.delete(`/accounts/${accountId}/categories/${id}`);

	return existing;

}

