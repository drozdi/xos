import { queryClient } from '@inccom/shared/api/query-client';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { create } from 'zustand';
import {
	requestAccountCreate,
	requestAccountDelete,
	requestAccountList,
	requestAccountRead,
	requestAccountUpdate,
} from '../api/account';
import { ACCOUNTS_LIST_QUERY_KEY } from '../api/queries';

export const useStoreAccounts = create<IStoreAccount>((set, get) => ({
	isLoading: false,
	error: '',
	list: [],
	load: async (reload = false) => {
		if (reload) {
			queryClient.removeQueries({
				queryKey: ['accounts'],
			});
		}
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await queryClient.fetchQuery({
				queryKey: ACCOUNTS_LIST_QUERY_KEY,
				queryFn: async () =>
					await requestAccountList({ limit: 100, offset: 0 }),
			});

			set({
				list: res.items,
				isLoading: false,
			});
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			notification.error('Ошибка', error);
			set({
				error,
				isLoading: false,
			});
		}
	},
	findById: (id) => {
		get().load();
		return get().list.find((item) => item.id === id);
	},
	add: async (data) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await requestAccountCreate(data);
			notification.success('Успешно!', `Счет "${res.label}" успешно добавлен!`);
			set({
				list: [...get().list, res],
				isLoading: false,
			});
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			notification.error('Ошибка', error);
			set({
				error,
				isLoading: false,
			});
		}
		return undefined;
	},
	detail: async (id) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await queryClient.fetchQuery({
				queryKey: ['accounts', id],
				queryFn: async () => await requestAccountRead(id),
			});
			set({ isLoading: false });
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			notification.error('Ошибка', error);
			set({
				error,
				isLoading: false,
			});
		}
		return undefined;
	},
	update: async (id, data) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await requestAccountUpdate(id, data);
			queryClient.setQueryData(['accounts', id], res);
			queryClient.resetQueries({
				queryKey: ['accounts'],
			});
			set({ isLoading: false });
			notification.success('Успешно', `Счет "${res?.label}" обнавлен!`);
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			notification.error('Ошибка', error);
			set({
				error,
				isLoading: false,
			});
		}
		return undefined;
	},
	delete: async (id) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await requestAccountDelete(id);
			queryClient.removeQueries({
				queryKey: ['accounts', id],
			});
			queryClient.resetQueries({
				queryKey: ['accounts'],
			});
			notification.success('Успешно!', `Счет "${res?.label}" удален!`);
			set({
				list: get().list.filter((item) => item.id !== id),
				isLoading: false,
			});
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			notification.error('Ошибка', error);
			set({
				error,
				isLoading: false,
			});
		}
		return undefined;
	},
}));
