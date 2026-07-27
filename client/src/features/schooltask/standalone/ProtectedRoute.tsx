import { Flex, Spin } from 'antd';
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
			<Flex align="center" justify="center" style={{ height: '100%', minHeight: 240 }}>
				<Spin size="large" />
			</Flex>
		);
	}

	if (!isAuthenticated || !canAccessSchooltaskFromRoles(roles)) {
		return <Navigate to="/auth/sign-in" replace />;
	}

	return children;
}
