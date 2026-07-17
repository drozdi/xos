import { api } from '@inccom/shared/api';

export async function requestUserProfileGet(): Promise<
	IResponse<{
		user: IUser;
	}>
> {
	const res = await api.get('/user_profile/');
	return res.data as IResponse<{ user: IUser }>;
}

export async function requestUserProfileDelete() {
	const res = await api.delete('/user_profile/');
	return res.data;
}

export async function requestUserProfileUpdate(
	userData: IUser,
): Promise<IResponse<IUser>> {
	const res = await api.patch('/user_profile/', userData);
	return res.data as IResponse<IUser>;
}

export async function requestUserProfileUpdatePassword(
	oldPassword: string,
	newPassword: string,
) {
	const res = await api.post('/user_profile/reset_password/', {
		password: newPassword,
		old_password: oldPassword,
	});
	return res.data;
}
