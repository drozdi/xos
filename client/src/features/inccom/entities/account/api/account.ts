import { api } from '@inccom/shared/api';
import { parsePaginatedResponse } from '@inccom/shared/api/parse-paginated-response';
import type { PaginatedResponse } from '@inccom/shared/types';
import type { ApiAccount } from '@inccom/shared/types/api';
import { mapAccountFromApi, mapAccountToApi } from '@inccom/shared/types/api';

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

export async function requestAccountList(
	params: Partial<IRequestList> = {},
): Promise<IResponseList<IAccount>> {
	const { page, size } = getPageSize(params);
	const res = await api.get<unknown>('/accounts', {
		params: { page, size },
	});
	const paginated = parsePaginatedResponse(res.data, (item) =>
		mapAccountFromApi(item as ApiAccount),
	);
	return toLegacyListResponse(paginated);
}

export async function requestAccountCreate({
	id,
	x_timestamp,
	...data
}: Partial<IAccount>): Promise<IResponse<IAccount>> {
	const res = await api.post<ApiAccount>('/accounts', mapAccountToApi(data));
	return mapAccountFromApi(res.data);
}

export async function requestAccountRead(
	id: IAccount['id'],
): Promise<IResponse<IAccount>> {
	const res = await api.get<ApiAccount>(`/accounts/${id}`);
	return mapAccountFromApi(res.data);
}

export async function requestAccountUpdate(
	id: IAccount['id'],
	{ x_timestamp, ...data }: Partial<IAccount>,
): Promise<IResponse<IAccount>> {
	const res = await api.patch<ApiAccount>(
		`/accounts/${id}`,
		mapAccountToApi(data),
	);
	return mapAccountFromApi(res.data);
}

export async function requestAccountDelete(
	id: IAccount['id'],
): Promise<IResponse<IAccount>> {
	const existing = await requestAccountRead(id);
	await api.delete(`/accounts/${id}`);
	return existing;
}

export async function requestAccountAddUser(
	id: IAccount['id'],
	data: { login: string },
): Promise<{ userId: number; login: string }> {
	const res = await api.post<{ userId: number; login: string }>(
		`/accounts/${id}/users`,
		data,
	);
	return res.data;
}

export async function requestAccountRemoveUser(
	id: IAccount['id'],
	userId: number,
): Promise<void> {
	await api.delete(`/accounts/${id}/users/${userId}`);
}
