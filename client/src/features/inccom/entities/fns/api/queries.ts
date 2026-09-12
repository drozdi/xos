import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	deleteFnsCredentials,
	fetchTransactionReceipt,
	applyReceiptItems,
	previewFnsReceipt,
	requestFnsCredentials,
	saveFnsCredentials,
	type FnsCredentialsWrite,
	type FnsReceiptPreviewPayload,
} from './fns';

export const fnsCredentialsQueryKey = ['inccom', 'fns', 'credentials'] as const;

export function useFnsCredentialsQuery() {
	return useQuery({
		queryKey: fnsCredentialsQueryKey,
		queryFn: requestFnsCredentials,
	});
}

export function useFnsCredentialsSave() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: FnsCredentialsWrite) => saveFnsCredentials(data),
		onSuccess: (data) => {
			queryClient.setQueryData(fnsCredentialsQueryKey, data);
		},
	});
}

export function useFnsCredentialsDelete() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteFnsCredentials(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: fnsCredentialsQueryKey });
		},
	});
}

export function useFnsReceiptPreview() {
	return useMutation({
		mutationFn: (payload: FnsReceiptPreviewPayload) => previewFnsReceipt(payload),
	});
}

export function useFnsReceiptFetch() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			transactionId,
			payload,
		}: {
			transactionId: number;
			payload?: FnsReceiptPreviewPayload & { fill_items?: boolean };
		}) => fetchTransactionReceipt(transactionId, payload),
		onSuccess: (_data, vars) => {
			void queryClient.invalidateQueries({
				queryKey: ['transactions', vars.transactionId],
			});
			void queryClient.invalidateQueries({ queryKey: ['transactions'] });
		},
	});
}

export function useFnsReceiptApplyItems() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (transactionId: number) => applyReceiptItems(transactionId),
		onSuccess: (_data, transactionId) => {
			void queryClient.invalidateQueries({
				queryKey: ['transactions', transactionId],
			});
			void queryClient.invalidateQueries({ queryKey: ['transactions'] });
		},
	});
}
