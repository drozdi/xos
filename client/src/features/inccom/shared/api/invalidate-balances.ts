import type { QueryClient } from '@tanstack/react-query';

export function invalidateAccountBalances(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: ['accounts'] });
}
