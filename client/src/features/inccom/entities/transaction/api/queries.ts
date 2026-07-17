import {

	useMutation,

	useQuery,

	useQueryClient,

	type UseQueryOptions,

} from '@tanstack/react-query';

import { invalidateAccountBalances } from '@inccom/shared/api/invalidate-balances';

import { defaultTransaction } from '../model/defaults';

import type { ITransaction, ITransactionPayload } from '../model/types';

import {

	requestTransactionCreate,

	requestTransactionDelete,

	requestTransactionList,

	requestTransactionRead,

	requestTransactionUpdate,

	type IRequestTransactionList,

} from './transaction';



const TRANSACTIONS_KEY = 'transactions';



export function useTransactionsQuery(

	params: IRequestTransactionList,

	options?: Omit<

		UseQueryOptions<IResponseList<ITransaction>>,

		'queryKey' | 'queryFn'

	>,

) {

	return useQuery({

		queryKey: [TRANSACTIONS_KEY, params],

		queryFn: () => requestTransactionList(params),

		enabled: params.accountId > 0,

		...options,

	});

}



export function useTransactionQuery(id?: ITransaction['id']) {

	return useQuery({

		queryKey: [TRANSACTIONS_KEY, id],

		queryFn: () =>

			id ? requestTransactionRead(id) : Promise.resolve(defaultTransaction),

		enabled: !!id,

	});

}



export function useTransactionCreate() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: (data: ITransactionPayload) => requestTransactionCreate(data),

		onSuccess: () => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

		},

	});

}



export function useTransactionUpdate() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: ({

			id,

			...data

		}: Partial<ITransactionPayload> & { id: ITransaction['id'] }) =>

			requestTransactionUpdate(id, data),

		onSuccess: (_data, variables) => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

			queryClient.invalidateQueries({

				queryKey: [TRANSACTIONS_KEY, variables.id],

			});

		},

	});

}



export function useTransactionDelete() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: (id: ITransaction['id']) => requestTransactionDelete(id),

		onSuccess: (_data, id) => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

			queryClient.removeQueries({ queryKey: [TRANSACTIONS_KEY, id] });

		},

	});

}

