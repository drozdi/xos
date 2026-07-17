import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from '@tanstack/react-query';
import { defaultAccount } from '../model/defaults';
import {
	requestAccountCreate,
	requestAccountDelete,
	requestAccountList,
	requestAccountRead,
	requestAccountUpdate,
	requestAccountAddUser,
	requestAccountRemoveUser,
} from './account';

const ACCOUNTS_KEY = 'accounts';

export const ACCOUNTS_LIST_PARAMS = { limit: 100, offset: 0 } as const;

export const ACCOUNTS_LIST_QUERY_KEY = [
	ACCOUNTS_KEY,
	ACCOUNTS_LIST_PARAMS,
] as const;

function createEmptyAccountsList(): IResponseList<IAccount> {
	return {
		items: [],
		countItems: 0,
		totalItems: 0,
		limit: ACCOUNTS_LIST_PARAMS.limit,
		offset: ACCOUNTS_LIST_PARAMS.offset,
		next: 0,
		prev: 0,
		total: 0,
	};
}

function upsertAccountInListCache(
	queryClient: ReturnType<typeof useQueryClient>,
	account: IAccount,
) {
	queryClient.setQueryData<IResponseList<IAccount>>(
		ACCOUNTS_LIST_QUERY_KEY,
		(old) => {
			const base = old?.items ? old : createEmptyAccountsList();
			const exists = base.items.some((item) => item.id === account.id);
			const items = exists
				? base.items.map((item) =>
						item.id === account.id ? account : item,
					)
				: [...base.items, account];
			const total = exists ? base.total : base.total + 1;
			return {
				...base,
				items,
				countItems: items.length,
				totalItems: total,
				total,
			};
		},
	);
}

function removeAccountFromListCache(
	queryClient: ReturnType<typeof useQueryClient>,
	id: IAccount['id'],
) {
	queryClient.setQueryData<IResponseList<IAccount>>(
		ACCOUNTS_LIST_QUERY_KEY,
		(old) => {
			if (!old?.items) {
				return old;
			}
			const items = old.items.filter((item) => item.id !== id);
			const total = Math.max(0, old.total - 1);
			return {
				...old,
				items,
				countItems: items.length,
				totalItems: total,
				total,
			};
		},
	);
}

export function useAccountsQuery(
	params: Partial<IRequestList> = ACCOUNTS_LIST_PARAMS,
	options?: Omit<
		UseQueryOptions<IResponseList<IAccount>>,
		'queryKey' | 'queryFn'
	>,
) {
	return useQuery({
		queryKey: [ACCOUNTS_KEY, params],
		queryFn: () => requestAccountList(params),
		...options,
	});
}

export function useAccountQuery(id?: IAccount['id']) {
	return useQuery({
		queryKey: [ACCOUNTS_KEY, id],
		queryFn: () =>
			id ? requestAccountRead(id) : Promise.resolve(defaultAccount),
		enabled: !!id,
	});
}

export function useAccountCreate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<IAccount>) => requestAccountCreate(data),
		onSuccess: async (account) => {
			upsertAccountInListCache(queryClient, account);
			await queryClient.refetchQueries({ queryKey: ACCOUNTS_LIST_QUERY_KEY });
		},
	});
}

export function useAccountUpdate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: Partial<IAccount> & { id: IAccount['id'] }) =>
			requestAccountUpdate(id, data),
		onSuccess: async (account, variables) => {
			upsertAccountInListCache(queryClient, account);
			await queryClient.refetchQueries({ queryKey: ACCOUNTS_LIST_QUERY_KEY });
			queryClient.invalidateQueries({
				queryKey: [ACCOUNTS_KEY, variables.id],
			});
		},
	});
}

export function useAccountDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: IAccount['id']) => requestAccountDelete(id),
		onSuccess: async (_data, id) => {
			removeAccountFromListCache(queryClient, id);
			await queryClient.refetchQueries({ queryKey: ACCOUNTS_LIST_QUERY_KEY });
			queryClient.removeQueries({ queryKey: [ACCOUNTS_KEY, id] });
		},
	});
}

export function useAccountAddUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			login,
		}: {
			id: IAccount['id'];
			login: string;
		}) => requestAccountAddUser(id, { login }),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [ACCOUNTS_KEY, variables.id],
			});
		},
	});
}

export function useAccountRemoveUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			userId,
		}: {
			id: IAccount['id'];
			userId: number;
		}) => requestAccountRemoveUser(id, userId),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: [ACCOUNTS_KEY, variables.id],
			});
		},
	});
}
