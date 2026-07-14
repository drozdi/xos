import { useQuery } from '@tanstack/react-query';

import { getAccount } from '@/core/api/endpoints/account';
import { queryKeys } from '@/core/api/queryKeys';

export function useAccount() {
	return useQuery({
		queryKey: queryKeys.account.detail,
		queryFn: getAccount,
	});
}
