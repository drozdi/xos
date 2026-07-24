import { getUser } from '@/core/api/endpoints/auth';
import { apiClient } from '@/core/api/client';
import type { ApiUser } from '@inccom/shared/types/api';

import type { IRegisterRequest } from '../model/types';

type LoginResponse = {
	token: string;
	refresh_token: string;
};

type RefreshResponse = {
	token: string;
	refresh_token: string;
};

export async function requestAuthenticationLogin(credentials: {
	username: string;
	password: string;
}): Promise<IResponse<LoginResponse>> {
	const { data } = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
	return data;
}

export async function requestAuthRegister(
	userData: IRegisterRequest,
): Promise<IResponse<ApiUser>> {
	const { data } = await apiClient.post<ApiUser>('/api/auth/register', userData);
	return data;
}

export async function requestAuthMe(): Promise<IResponse<ApiUser>> {
	try {
		const { data } = await apiClient.get<ApiUser>('/api/auth/me');
		return data;
	} catch {
		const user = await getUser();
		return {
			id: user.id,
			login: user.login ?? '',
			email: user.email ?? '',
			name: user.alias ?? user.login ?? null,
		};
	}
}

export async function requestAuthenticationRefresh(refreshToken: string): Promise<
	IResponse<{
		token: {
			access: string;
			refresh: string;
		};
	}>
> {
	const { data } = await apiClient.post<RefreshResponse>('/api/token/refresh', {
		refresh_token: refreshToken,
	});
	return {
		token: {
			access: data.token,
			refresh: data.refresh_token,
		},
	};
}

export function mapAuthMeToUser(data: ApiUser): IUser {
	const displayName = data.name ?? data.login ?? '';

	return {
		id: data.id,
		login: data.login,
		email: data.email,
		name: data.name ?? undefined,
		alias: displayName,
		first_name: displayName,
		second_name: '',
		patronymic: '',
		description: '',
		date_register: '',
		last_login: '',
		x_timestamp: '',
	};
}

export function mapRegisterResponseToUser(
	data: ApiUser,
	registerData: IRegisterRequest,
): IUser {
	return mapAuthMeToUser({
		...data,
		name: data.name ?? registerData.name,
	});
}
