import { queryClient } from '@inccom/shared/api/query-client';
import { notification } from '@inccom/shared/notification';
import { getterZustandMiddleware } from '@inccom/shared/stores';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { create } from 'zustand';
import { mapAuthMeToUser, requestAuthMe } from '../api/auth';
import {
	requestUserProfileDelete,
	requestUserProfileUpdate,
	requestUserProfileUpdatePassword,
} from '../api/profile';

export const useStoreUserProfile = create<IStoreUserProfile>(
	getterZustandMiddleware((set, get) => ({
		isLoading: false,
		error: '',
		userData: undefined,
		setUserData(data: Partial<IUser>) {
			set({
				userData: {
					...(get().userData ?? ({} as IUser)),
					...data,
				},
			});
		},

		async load(reloading = false) {
			if (reloading) {
				queryClient.removeQueries({
					queryKey: ['user-profile'],
				});
			}
			set({
				isLoading: true,
				error: '',
			});
			try {
				const userData = await queryClient.fetchQuery({
					queryKey: ['user-profile'],
					queryFn: async () => {
						const response = await requestAuthMe();
						return mapAuthMeToUser(response);
					},
				});

				set({
					isLoading: false,
					userData,
				});
				return userData;
			} catch (e: unknown) {
				console.error(e);
				const error = getErrorMessage(e);
				set({
					isLoading: false,
					error,
				});
			}
			return undefined;
		},
		async update(userData: IUser) {
			set({
				isLoading: false,
				error: '',
			});
			try {
				const response = await requestUserProfileUpdate(userData);
				set({
					isLoading: false,
					userData: {
						...(get().userData ?? ({} as IUser)),
						...response,
					},
				});
				return response;
			} catch (e: unknown) {
				console.error(e);
				const error = getErrorMessage(e, 'Ошибка обновления');
				notification.error(error);
				set({
					isLoading: false,
					error,
				});
			}
			return undefined;
		},
		async updatePassword(oldPassword: string, newPassword: string) {
			set({
				isLoading: false,
				error: '',
			});

			try {
				await requestUserProfileUpdatePassword(oldPassword, newPassword);
				set({
					isLoading: false,
				});
				return true;
			} catch (e: unknown) {
				console.log(e);
				const error = getErrorMessage(e, 'Ошибка обновления');
				notification.error(error);
				set({
					isLoading: false,
					error,
				});
			}
			return false;
		},
		async delete() {
			set({
				isLoading: false,
				error: '',
			});
			try {
				const res = await requestUserProfileDelete();
				return res;
			} catch (e: unknown) {
				console.log(e);
				const error = getErrorMessage(e, 'Ошибка удаления');

				notification.error(error);
				set({
					isLoading: false,
					error,
				});
			}
		},
		reset() {
			set({
				userData: undefined,
			});
		},
	})),
);
