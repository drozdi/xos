import { Center, Loader } from '@mantine/core';
import { Navigate } from 'react-router-dom';

import { api } from '@inccom/shared/api';
import { useStoreAuth } from '@inccom/entities/user';

import { resolveAuthRealm } from '@/core/auth/tokenStorage';

/**
 * Embedded (окно XOS): доступ уже через desktop-сессию.
 * Standalone (/inccom): email-вход и доступ к модулю inccom.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useStoreAuth((s) => s.isAuthenticated);
	const isLoading = useStoreAuth((s) => s.isLoading);
	const realm = resolveAuthRealm();

	if (realm === 'desktop') {
		return children;
	}

	const hasTokens = !!api.getRefreshToken() && !!api.getAccessToken();

	if (isLoading || (hasTokens && !isAuthenticated)) {
		return (
			<Center h="100%" mih={240}>
				<Loader size="lg" />
			</Center>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/auth/sign-in" replace />;
	}

	return children;
}
