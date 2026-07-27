import { Alert, Button, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { isAxiosError } from 'axios';

import { loginRequestSchema } from '@/core/api/endpoints/auth';
import { useAuthStore } from '@/core/auth/authStore';
import type { ApiError } from '@/types/api.types';

export function LoginScreen() {
	const login = useAuthStore((state) => state.login);
	const isLoading = useAuthStore((state) => state.isLoading);
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
			username: '',
			password: '',
		},
		validate: zod4Resolver(loginRequestSchema),
	});

	const handleSubmit = form.onSubmit(async (values) => {
		setError(null);
		try {
			await login(values);
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
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-body text-text">
			<Paper shadow="md" p="xl" radius="md" w={360}>
				<Title order={2} ta="center" mb="lg">
					XOS Login
				</Title>
				<form onSubmit={handleSubmit}>
					<Stack gap="md">
						{error ? (
							<Alert color="red" variant="light">
								{error}
							</Alert>
						) : null}
						<TextInput
							label="Login"
							placeholder="Enter login"
							key={form.key('username')}
							{...form.getInputProps('username')}
							required
						/>
						<PasswordInput
							label="Password"
							placeholder="Enter password"
							key={form.key('password')}
							{...form.getInputProps('password')}
							required
						/>
						<Button type="submit" fullWidth loading={isLoading}>
							Sign in
						</Button>
					</Stack>
				</form>
			</Paper>
		</div>
	);
}
