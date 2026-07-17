import { getUser } from '@/core/api/endpoints/auth';
import type { ApiUser } from '@inccom/shared/types/api';

import type { IRegisterRequest } from '../model/types';

export async function requestAuthenticationLogin(_credentials: {
	username: string;
	password: string;
}): Promise<IResponse<{ token: string; refresh_token: string }>> {
	throw new Error('IncCom auth is managed by XOS');
}

export async function requestAuthRegister(
	_userData: IRegisterRequest,
): Promise<IResponse<ApiUser>> {
	throw new Error('IncCom registration is managed by XOS');
}

export async function requestAuthMe(): Promise<IResponse<ApiUser>> {
	const user = await getUser();
	return {
		id: user.id,
		login: user.login ?? '',
		email: user.email ?? '',
		name: user.alias ?? user.login ?? null,
	};
}

export async function requestAuthenticationRefresh(_refreshToken: string): Promise<
	IResponse<{
		token: {
			access: string;
			refresh: string;
		};
	}>
> {
	throw new Error('IncCom token refresh is managed by XOS');
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
