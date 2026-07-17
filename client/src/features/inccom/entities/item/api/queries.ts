import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from '@tanstack/react-query';
import { defaultItem } from '../model/defaults';
import {
	requestItemCreate,
	requestItemDelete,
	requestItemList,
	requestItemRead,
	requestItemUpdate,
	type IRequestItemList,
} from './item';

const ITEMS_KEY = 'items';

export function useItemsQuery(
	params: IRequestItemList = { limit: 100, offset: 0 },
	options?: Omit<
		UseQueryOptions<IResponseList<IItem>>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery({
		queryKey: [ITEMS_KEY, params],
		queryFn: () => requestItemList(params),
		...options,
	});
}

export function useItemQuery(id?: IItem['id']) {
	return useQuery({
		queryKey: [ITEMS_KEY, id],
		queryFn: () => (id ? requestItemRead(id) : Promise.resolve(defaultItem)),
		enabled: !!id,
	});
}

export function useItemCreate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<IItem>) => requestItemCreate(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
		},
	});
}

export function useItemUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: Partial<IItem> & { id: IItem['id'] }) => requestItemUpdate(id, data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
			queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, variables.id] });
		},
	});
}

export function useItemDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: IItem['id']) => requestItemDelete(id),
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
			queryClient.removeQueries({ queryKey: [ITEMS_KEY, id] });
		},
	});
}
