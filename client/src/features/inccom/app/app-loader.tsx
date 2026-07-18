import { useStoreAccounts } from '@inccom/entities/account';
import { useStoreCategories } from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { Loading } from '@inccom/shared/ui';
import { useEffect } from 'react';

export function AppLoader({ children }: { children: React.ReactNode }) {
	const isLoadingUser = useStoreUserProfile((s) => s.isLoading);
	const isLoadingAccounts = useStoreAccounts((s) => s.isLoading);
	const isLoadingCategories = useStoreCategories((s) => s.isLoading);
	const isLoading = isLoadingUser || isLoadingAccounts || isLoadingCategories;

	useEffect(() => {
		void useStoreUserProfile.getState().load(true);
		void useStoreAccounts.getState().load(true);
		void useStoreCategories.getState().load(true);
	}, []);

	return (
		<Loading active={isLoading} keepMounted h="100%" style={{ flex: 1, minHeight: 0 }}>
			{children}
		</Loading>
	);
}
