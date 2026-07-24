import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { loginRequestSchema } from '@/core/api/endpoints/auth';
import { useAuthStore } from '@/core/auth/authStore';
import type { ApiError } from '@/types/api.types';

export function LoginScreen() {
	const login = useAuthStore((state) => state.login);
	const isLoading = useAuthStore((state) => state.isLoading);
	const [error, setError] = useState<string | null>(null);
	const [form] = Form.useForm<{ username: string; password: string }>();

	const handleFinish = async (values: { username: string; password: string }) => {
		setError(null);
		const parsed = loginRequestSchema.safeParse(values);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? 'Проверьте поля');
			return;
		}
		try {
			await login(parsed.data);
		} catch (err) {
			if (isAxiosError<ApiError>(err)) {
				const message =
					err.response?.data?.message ??
					err.response?.data?.error ??
					'Неверный логин или пароль';
				setError(message);
				return;
			}
			setError('Не удалось выполнить вход');
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-body text-text">
			<Card style={{ width: 360 }}>
				<Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
					XOS Login
				</Typography.Title>
				<Form form={form} layout="vertical" onFinish={(v) => void handleFinish(v)}>
					{error ? (
						<Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
					) : null}
					<Form.Item
						label="Login"
						name="username"
						rules={[{ required: true, message: 'Введите логин' }]}
					>
						<Input placeholder="Enter login" autoComplete="username" />
					</Form.Item>
					<Form.Item
						label="Password"
						name="password"
						rules={[{ required: true, message: 'Введите пароль' }]}
					>
						<Input.Password placeholder="Enter password" autoComplete="current-password" />
					</Form.Item>
					<Button type="primary" htmlType="submit" block loading={isLoading}>
						Sign in
					</Button>
				</Form>
			</Card>
		</div>
	);
}
