import { useMemo } from 'react';

export function useQueryLoading(...queries: { isLoading?: boolean }[]): boolean {
	return useMemo(
		() => queries.some((query) => query.isLoading),
		queries.map((query) => query.isLoading),
	);
}

export function useQueryPending(...queries: { isPending?: boolean }[]): boolean {
	return useMemo(
		() => queries.some((query) => query.isPending),
		queries.map((query) => query.isPending),
	);
}

export function useQuerySuccess(...queries: { isSuccess?: boolean }[]): boolean {
	return useMemo(
		() => queries.some((query) => query.isSuccess),
		queries.map((query) => query.isSuccess),
	);
}
