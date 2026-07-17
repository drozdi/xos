import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from '@tanstack/react-query';
import { defaultCategory } from '../model/defaults';
import {
	requestCategoryCreate,
	requestCategoryDelete,
	requestCategoryList,
	requestCategoryRead,
	requestCategoryUpdate,
	type IRequestCategoryList,
} from './transaction-category';

const CATEGORIES_KEY = 'categories';

export function buildTransactionCategoriesQueryParams(
	accountId: number,
): IRequestCategoryList {
	return { accountId, limit: 100, offset: 0 };
}

export function useTransactionCategoriesQuery(
	params: IRequestCategoryList = { limit: 100, offset: 0 },
	options?: Omit<
		UseQueryOptions<IResponseList<ICategory>>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery({
		queryKey: [CATEGORIES_KEY, params],
		queryFn: () => requestCategoryList(params),
		...options,
	});
}

export function useTransactionCategoryQuery(id?: ICategory['id']) {
	const isValidId = id !== undefined && !Number.isNaN(id) && id > 0;
	return useQuery({
		queryKey: [CATEGORIES_KEY, id],
		queryFn: () =>
			isValidId
				? requestCategoryRead(id)
				: Promise.resolve(defaultCategory),
		enabled: isValidId,
	});
}

export function useTransactionCategoryCreate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<ICategory>) => requestCategoryCreate(data),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
			if (variables.account_id) {
				await queryClient.refetchQueries({
					queryKey: [
						CATEGORIES_KEY,
						buildTransactionCategoriesQueryParams(variables.account_id),
					],
				});
			}
		},
	});
}

export function useTransactionCategoryUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: Partial<ICategory> & { id: ICategory['id'] }) =>
			requestCategoryUpdate(id, data),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
			queryClient.invalidateQueries({
				queryKey: [CATEGORIES_KEY, variables.id],
			});
		},
	});
}

export function useTransactionCategoryDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: ICategory['id']) => requestCategoryDelete(id),
		onSuccess: async (_data, id) => {
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
			queryClient.removeQueries({ queryKey: [CATEGORIES_KEY, id] });
		},
	});
}
