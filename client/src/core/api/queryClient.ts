import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity,
			retry: false,
			gcTime: 1000 * 60 * 60,
			throwOnError: false,
		},
	},
});
