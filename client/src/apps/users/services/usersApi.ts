import { listUsers } from '@/core/api/endpoints/main';
import type { ListRequest, PaginatedResponse, UserListItem } from '@/types/api.types';

export async function fetchUsersList(
	request: ListRequest = {},
): Promise<PaginatedResponse<UserListItem>> {
	return listUsers(request);
}
