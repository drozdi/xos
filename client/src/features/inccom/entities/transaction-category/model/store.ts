import { queryClient } from '@inccom/shared/api/query-client';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { create } from 'zustand';
import {
	requestCategoryCreate,
	requestCategoryDelete,
	requestCategoryList,
	requestCategoryRead,
	requestCategoryUpdate,
} from '../api/transaction-category';

export const useStoreCategories = create<IStoreCategory>((set, get) => ({
	isLoading: false,
	error: '',
	list: [],
	loadedAccountIds: [] as number[],
	load: async (reload = false) => {
		if (reload) {
			queryClient.removeQueries({
				queryKey: ['categories'],
			});
			set({ loadedAccountIds: [] });
		}
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await queryClient.fetchQuery({
				queryKey: ['categories', { limit: 100, offset: 0 }],
				queryFn: async () =>
					await requestCategoryList({ limit: 100, offset: 0 }),
			});

			set({
				list: res.items,
				isLoading: false,
				loadedAccountIds: [
					...new Set(res.items.map((item) => item.account_id)),
				],
			});
		} catch (error: unknown) {
			console.error(error);
			set({
				isLoading: false,
				error: getErrorMessage(error),
			});
		}
	},
	selectAccount: (account_id) => {
		if (!account_id || Number.isNaN(account_id)) {
			return [];
		}

		const state = get();
		const cached = state.list.filter((item) => item.account_id === account_id);
		const loadedAccountIds = state.loadedAccountIds ?? [];

		if (loadedAccountIds.includes(account_id)) {
			return cached;
		}

		set({ loadedAccountIds: [...loadedAccountIds, account_id] });

		void queryClient
			.fetchQuery({
				queryKey: [
					'categories',
					{ accountId: account_id, limit: 100, offset: 0 },
				],
				queryFn: async () =>
					await requestCategoryList({
						accountId: account_id,
						limit: 100,
						offset: 0,
					}),
			})
			.then((res) => {
				set({
					list: [
						...get().list.filter((item) => item.account_id !== account_id),
						...res.items,
					],
				});
			})
			.catch((error: unknown) => {
				const currentLoaded = get().loadedAccountIds ?? [];
				set({
					loadedAccountIds: currentLoaded.filter(
						(loadedId: number) => loadedId !== account_id,
					),
					error: getErrorMessage(error),
				});
			});

		return cached;
	},
	detail: async (id) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await queryClient.fetchQuery({
				queryKey: ['categories', id],
				queryFn: async () => await requestCategoryRead(id),
			});
			set({ isLoading: false });
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			set({
				error,
				isLoading: false,
			});
			notification.error('Ошибка', error);
		}
		return undefined;
	},
	update: async (id, data) => {
		set({
			isLoading: true,
			error: '',
		});
		const category = get().findById(id);
		try {
			const res = await requestCategoryUpdate(id, data);
			queryClient.setQueryData(['categories', id], res);
			queryClient.resetQueries({
				queryKey: ['categories'],
			});

			notification.success(
				'Успешно',
				`Категория "${category?.label}" переминована в ${res.label} ${res.mcc ? ` с кодом ${res.mcc}` : ''}!`,
			);

			set({
				isLoading: false,
			});
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			set({
				error,
				isLoading: false,
			});
			notification.error('Ошибка', error);
		}
		return undefined;
	},
	add: async (data) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await requestCategoryCreate(data);
			set({
				list: [...get().list, res],
				isLoading: false,
			});
			notification.success(
				'Успешно!',
				`Категория "${res.label}" успешна добавлена!`,
			);
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			set({
				error,
				isLoading: false,
			});
			notification.error('Ошибка', error);
		}
		return undefined;
	},
	delete: async (id) => {
		set({
			isLoading: true,
			error: '',
		});
		try {
			const res = await requestCategoryDelete(id);
			queryClient.removeQueries({
				queryKey: ['categories', id],
			});
			queryClient.resetQueries({
				queryKey: ['categories'],
			});
			notification.success('Успешно!', `Категория "${res?.label}" удалена`);
			set({
				list: get().list.filter((item) => item.id !== res.id),
				isLoading: false,
			});
			return res;
		} catch (e: unknown) {
			const error = getErrorMessage(e);
			set({
				error,
				isLoading: false,
			});
			notification.error('Ошибка', error);
		}
		return undefined;
	},
	findById: (id) => {
		get().load();
		return get().list.find((item) => item.id === id);
	},
	findLabelById: (id) => {
		return get().findById(id)?.label || '';
	},
}));
