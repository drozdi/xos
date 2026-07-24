import { useStoreAuth } from '@inccom/entities/user';
import { Navigate } from 'react-router-dom';

import { resolveAuthRealm } from '@/core/auth/tokenStorage';

/**
 * Embedded (окно XOS): доступ уже через desktop-сессию.
 * Standalone (/inccom): свой email-вход.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const storeAuth = useStoreAuth();
	const realm = resolveAuthRealm();

	if (realm === 'desktop') {
		return children;
	}

	if (!storeAuth.isAuth) {
		return <Navigate to="/auth/sign-in" replace />;
	}

	return children;
}
