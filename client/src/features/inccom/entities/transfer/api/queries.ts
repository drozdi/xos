import {

	useMutation,

	useQuery,

	useQueryClient,

	type UseQueryOptions,

} from '@tanstack/react-query';

import { invalidateAccountBalances } from '@inccom/shared/api/invalidate-balances';

import { defaultTransfer } from '../model/defaults';

import type { ITransferPayload } from '../model/types';

import {

	requestTransferCreate,

	requestTransferDelete,

	requestTransferList,

	requestTransferRead,

	requestTransferUpdate,

	type IRequestTransferList,

} from './transfer';



const TRANSFERS_KEY = 'transfers';

const TRANSACTIONS_KEY = 'transactions';



export function useTransfersQuery(

	params: IRequestTransferList = { limit: 100, offset: 0 },

	options?: Omit<

		UseQueryOptions<IResponseList<ITransfer>>,

		'queryKey' | 'queryFn'

	>,

) {

	return useQuery({

		queryKey: [TRANSFERS_KEY, params],

		queryFn: () => requestTransferList(params),

		...options,

	});

}



export function useTransferQuery(id?: ITransfer['id']) {

	return useQuery({

		queryKey: [TRANSFERS_KEY, id],

		queryFn: () =>

			id ? requestTransferRead(id) : Promise.resolve(defaultTransfer),

		enabled: !!id,

	});

}



export function useTransferCreate() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: (data: ITransferPayload) => requestTransferCreate(data),

		onSuccess: () => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSFERS_KEY] });

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

		},

	});

}



export function useTransferUpdate() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: ({

			id,

			...data

		}: Partial<ITransferPayload> & { id: ITransfer['id'] }) =>

			requestTransferUpdate(id, data),

		onSuccess: (_data, variables) => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSFERS_KEY] });

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

			queryClient.invalidateQueries({

				queryKey: [TRANSFERS_KEY, variables.id],

			});

		},

	});

}



export function useTransferDelete() {

	const queryClient = useQueryClient();

	return useMutation({

		mutationFn: (id: ITransfer['id']) => requestTransferDelete(id),

		onSuccess: (_data, id) => {

			invalidateAccountBalances(queryClient);

			queryClient.invalidateQueries({ queryKey: [TRANSFERS_KEY] });

			queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });

			queryClient.removeQueries({ queryKey: [TRANSFERS_KEY, id] });

		},

	});

}

