import { notifications } from '@mantine/notifications';
import { apiClient } from '@/core/api/client';
import { loginResponseSchema, type UserSummaryDto } from '@/core/api/endpoints/auth';
import { useAuthStore } from '@/core/auth/authStore';
import * as tokenStorage from '@/core/auth/tokenStorage';
import { canAccessSchooltaskFromRoles } from '@/features/schooltask/schooltaskAccess';

export async function schooltaskEmailLogin(username: string, password: string): Promise<boolean> {
	try {
		const { data } = await apiClient.post<unknown>('/api/schooltask/auth/login', {
			username,
			password,
		});
		const parsed = loginResponseSchema.parse(data);
		if (!canAccessSchooltaskFromRoles(parsed.user?.roles)) {
			notifications.show({
				color: 'red',
				message: 'Нет доступа к приложению «Школа»',
			});
			return false;
		}
		tokenStorage.setTokens(parsed.token, parsed.refresh_token, 'app');
		await useAuthStore.getState().hydrate('app');
		if (!useAuthStore.getState().isAuthenticated) {
			notifications.show({ color: 'red', message: 'Не удалось восстановить сессию' });
			tokenStorage.clearTokens('app');
			return false;
		}
		return true;
	} catch {
		notifications.show({ color: 'red', message: 'Ошибка входа' });
		return false;
	}
}

export async function schooltaskEmailLogout(): Promise<void> {
	const refresh = tokenStorage.getRefreshToken('app');
	try {
		if (refresh) {
			await apiClient.post('/api/schooltask/auth/logout', { refresh_token: refresh });
		}
	} catch {
		// ignore
	} finally {
		tokenStorage.clearTokens('app');
		useAuthStore.setState({
			user: null,
			scopes: {},
			isAuthenticated: false,
			isLoading: false,
		});
	}
}

export type { UserSummaryDto };
