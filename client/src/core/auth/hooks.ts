import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/core/api/queryKeys';
import { getAccesses, getAccountMap } from '@/core/api/endpoints/account';
import { getUser, loginCheck } from '@/core/api/endpoints/auth';
import { useAuthStore } from '@/core/auth/authStore';
import { joinLevel, setMapScopes } from '@/core/auth/coreScopes';

export function useLoginCheck() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return useQuery({
		queryKey: queryKeys.auth.check,
		queryFn: loginCheck,
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000,
	});
}

export function useUser() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return useQuery({
		queryKey: queryKeys.auth.user,
		queryFn: getUser,
		enabled: isAuthenticated,
	});
}

export function useAccesses() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return useQuery({
		queryKey: queryKeys.account.accesses,
		queryFn: async () => {
			const [accesses, map] = await Promise.all([getAccesses(), getAccountMap()]);
			joinLevel(accesses);
			setMapScopes(map);
			useAuthStore.setState({ scopes: accesses });
			return accesses;
		},
		enabled: isAuthenticated,
	});
}
