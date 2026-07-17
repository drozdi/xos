import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from '@tanstack/react-query';
import { defaultItemCategory } from '../model/defaults';
import {
	requestItemCategoryCreate,
	requestItemCategoryDelete,
	requestItemCategoryList,
	requestItemCategoryRead,
	requestItemCategoryUpdate,
	type IRequestItemCategoryList,
} from './item-category';

const ITEM_CATEGORIES_KEY = 'item-categories';

export const ITEM_CATEGORIES_ALL_PARAMS = { limit: 100, offset: 0 } as const;

export const ITEM_CATEGORIES_ROOT_PARAMS = {
	parent: 'null' as const,
	limit: 100,
	offset: 0,
};

export const ITEM_CATEGORIES_ALL_QUERY_KEY = [
	ITEM_CATEGORIES_KEY,
	ITEM_CATEGORIES_ALL_PARAMS,
] as const;

export const ITEM_CATEGORIES_ROOT_QUERY_KEY = [
	ITEM_CATEGORIES_KEY,
	ITEM_CATEGORIES_ROOT_PARAMS,
] as const;

function itemCategoriesQueryKey(params: IRequestItemCategoryList) {
	return [ITEM_CATEGORIES_KEY, params] as const;
}

function invalidateItemCategoriesQueries(
	queryClient: ReturnType<typeof useQueryClient>,
) {
	return queryClient.invalidateQueries({ queryKey: [ITEM_CATEGORIES_KEY] });
}

export function useItemCategoriesQuery(
	params: IRequestItemCategoryList = ITEM_CATEGORIES_ALL_PARAMS,
	options?: Omit<
		UseQueryOptions<IResponseList<IItemCategory>>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery({
		queryKey: itemCategoriesQueryKey(params),
		queryFn: () => requestItemCategoryList(params),
		...options,
	});
}

export function useItemCategoryQuery(id?: IItemCategory['id']) {
	const isValidId = id !== undefined && !Number.isNaN(id) && id > 0;
	return useQuery({
		queryKey: [ITEM_CATEGORIES_KEY, id],
		queryFn: () =>
			isValidId
				? requestItemCategoryRead(id)
				: Promise.resolve(defaultItemCategory),
		enabled: isValidId,
	});
}

export function useItemCategoryCreate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<IItemCategory>) =>
			requestItemCategoryCreate(data),
		onSuccess: async () => {
			await invalidateItemCategoriesQueries(queryClient);
		},
	});
}

export function useItemCategoryUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: Partial<IItemCategory> & { id: IItemCategory['id'] }) =>
			requestItemCategoryUpdate(id, data),
		onSuccess: async (_data, variables) => {
			await invalidateItemCategoriesQueries(queryClient);
			queryClient.invalidateQueries({
				queryKey: [ITEM_CATEGORIES_KEY, variables.id],
			});
		},
	});
}

export function useItemCategoryDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: IItemCategory['id']) =>
			requestItemCategoryDelete(id),
		onSuccess: async (_data, id) => {
			await invalidateItemCategoriesQueries(queryClient);
			queryClient.removeQueries({ queryKey: [ITEM_CATEGORIES_KEY, id] });
		},
	});
}

export function buildItemCategoriesChildParams(
	parentId: number,
): IRequestItemCategoryList {
	return {
		parent: parentId,
		limit: 100,
		offset: 0,
	};
}
