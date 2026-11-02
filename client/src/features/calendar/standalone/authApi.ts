import { notifications } from '@mantine/notifications';

import { apiClient } from '@/core/api/client';
import { loginResponseSchema } from '@/core/api/endpoints/auth';
import { useAuthStore } from '@/core/auth/authStore';
import * as tokenStorage from '@/core/auth/tokenStorage';

export async function calendarEmailLogin(username: string, password: string): Promise<boolean> {
	try {
		const { data } = await apiClient.post<unknown>(
			'/api/calendar/auth/login',
			{ username, password },
			{ withCredentials: true },
		);
		const parsed = loginResponseSchema.parse(data);
		tokenStorage.setAccessToken(parsed.token, 'app');
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

export async function calendarEmailLogout(): Promise<void> {
	try {
		await apiClient.post('/api/calendar/auth/logout', {}, { withCredentials: true });
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
