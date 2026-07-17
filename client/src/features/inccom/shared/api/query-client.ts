import { QueryCache, QueryClient } from '@tanstack/react-query';

export const queryCache = new QueryCache({});
export const queryClient = new QueryClient({
	queryCache,
	defaultOptions: {
		queries: {
			// Infinity: без авто-refetch, но invalidateQueries работает (в отличие от 'static')
			staleTime: Infinity,
			enabled: true,
			throwOnError: false,
			retry: false,
			gcTime: 1000 * 60 * 60,
		},
	},
});
