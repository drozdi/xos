import { apiClient } from '@/core/api/client';
import type { ApiUser } from '@inccom/shared/types/api';

import type { IRegisterRequest } from '../model/types';

type LoginResponse = {
	token: string;
	refresh_token: string;
	user?: ApiUser;
};
type RefreshResponse = {
	token: string;
	refresh_token: string;
};

export async function requestAuthenticationLogin(credentials: {
	username: string;
	password: string;
}): Promise<IResponse<LoginResponse>> {
	const { data } = await apiClient.post<LoginResponse>('/api/IncCom/auth/login', credentials);
	return data;
}

export async function requestAuthRegister(
	userData: IRegisterRequest,
): Promise<IResponse<ApiUser>> {
	const { data } = await apiClient.post<ApiUser>('/api/IncCom/auth/register', userData);
	return data;
}

export async function requestAuthMe(): Promise<IResponse<ApiUser>> {
	const { data } = await apiClient.get<ApiUser>('/api/IncCom/auth/me');
	return data;
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
