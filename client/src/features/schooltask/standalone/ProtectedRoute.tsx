import { Center, Loader } from '@mantine/core';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/core/auth/authStore';
import * as tokenStorage from '@/core/auth/tokenStorage';
import { canAccessSchooltaskFromRoles } from '@/features/schooltask/schooltaskAccess';

/**
 * Desktop (окно): сессия уже есть.
 * Standalone (/schooltask): email-вход и роль schooltask.
 */
export function SchooltaskProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const isLoading = useAuthStore((s) => s.isLoading);
	const roles = useAuthStore((s) => s.user?.roles);
	const realm = tokenStorage.resolveAuthRealm();

	if (realm === 'desktop') {
		return children;
	}

	if (isLoading) {
		return (
			<Center h="100%" mih={240}>
				<Loader size="lg" />
			</Center>
		);
	}

	if (!isAuthenticated || !canAccessSchooltaskFromRoles(roles)) {
		return <Navigate to="/auth/sign-in" replace />;
	}

	return children;
}
