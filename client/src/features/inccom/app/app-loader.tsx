import { useStoreAccounts } from '@inccom/entities/account';
import { useStoreCategories } from '@inccom/entities/transaction-category';
import { useStoreAuth, useStoreUserProfile } from '@inccom/entities/user';
import { Loading } from '@inccom/shared/ui';
import { useEffect } from 'react';

import { resolveAuthRealm } from '@/core/auth/tokenStorage';

export function AppLoader({ children }: { children: React.ReactNode }) {
	const isLoadingUser = useStoreUserProfile((s) => s.isLoading);
	const isLoadingAccounts = useStoreAccounts((s) => s.isLoading);
	const isLoadingCategories = useStoreCategories((s) => s.isLoading);
	const isAuth = useStoreAuth((s) => s.isAuth);
	const realm = resolveAuthRealm();
	const shouldLoadData = realm === 'desktop' || isAuth;
	const isLoading = shouldLoadData && (isLoadingUser || isLoadingAccounts || isLoadingCategories);

	useEffect(() => {
		void useStoreAuth.getState().load();
	}, []);

	useEffect(() => {
		if (!shouldLoadData) {
			return;
		}
		void useStoreUserProfile.getState().load(true);
		void useStoreAccounts.getState().load(true);
		void useStoreCategories.getState().load(true);
	}, [shouldLoadData]);

	return (
		<Loading active={isLoading} keepMounted h="100%" style={{ flex: 1, minHeight: 0 }}>
			{children}
		</Loading>
	);
}
