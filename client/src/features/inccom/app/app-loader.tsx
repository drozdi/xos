import { useStoreAccounts } from '@inccom/entities/account';
import { useStoreCategories } from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { useQueryLoading } from '@inccom/shared/hooks';
import { Loading } from '@inccom/shared/ui';
import { useEffect } from 'react';

export function AppLoader({ children }: { children: React.ReactNode }) {
	const storeAccounts = useStoreAccounts();
	const storeCategories = useStoreCategories();
	const storeUserProfile = useStoreUserProfile();

	const isLoading = useQueryLoading(storeUserProfile, storeAccounts, storeCategories);

	useEffect(() => {
		void storeUserProfile.load(true);
		void storeAccounts.load(true);
		void storeCategories.load(true);
	}, [storeAccounts, storeCategories, storeUserProfile]);

	return (
		<Loading active={isLoading} keepMounted>
			{children}
		</Loading>
	);
}
