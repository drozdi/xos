import { useStoreAccounts } from '@inccom/entities/account';
import { useStoreCategories } from '@inccom/entities/transaction-category';
import { useStoreAuth, useStoreUserProfile } from '@inccom/entities/user';
import { Loading } from '@inccom/shared/ui';
import { ensureInccomTablePrefs } from '@inccom/shared/ui/table/tablePrefs';
import { useEffect, useState } from 'react';

import { resolveAuthRealm } from '@/core/auth/tokenStorage';

export function AppLoader({ children }: { children: React.ReactNode }) {
	const [prefsReady, setPrefsReady] = useState(false);
	const isAuthLoading = useStoreAuth((s) => s.isLoading);
	const isAuthenticated = useStoreAuth((s) => s.isAuthenticated);
	const realm = resolveAuthRealm();
	const shouldLoadData = realm === 'desktop' || isAuthenticated;

	useEffect(() => {
		void useStoreAuth.getState().load();
	}, []);

	useEffect(() => {
		let alive = true;
		void ensureInccomTablePrefs()
			.catch(() => undefined)
			.finally(() => {
				if (alive) {
					setPrefsReady(true);
				}
			});
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		if (!shouldLoadData) {
			return;
		}
		void useStoreUserProfile.getState().load(true);
		void useStoreAccounts.getState().load(true);
		void useStoreCategories.getState().load(true);
	}, [shouldLoadData]);

	const showBlockingLoader = !prefsReady || (realm !== 'desktop' && isAuthLoading);

	return (
		<Loading active={showBlockingLoader} keepMounted h="100%" style={{ flex: 1, minHeight: 0 }}>
			{children}
		</Loading>
	);
}
