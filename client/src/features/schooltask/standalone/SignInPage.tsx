import { Button, Center, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { schooltaskEmailLogin } from './authApi';

export function SchooltaskSignInPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const form = useForm({
		initialValues: { username: '', password: '' },
		validate: {
			username: (v) => (v.trim() ? null : 'Введите email'),
			password: (v) => (v ? null : 'Введите пароль'),
		},
	});

	const handleSubmit = async (values: { username: string; password: string }) => {
		setLoading(true);
		try {
			const ok = await schooltaskEmailLogin(values.username, values.password);
			if (ok) {
				navigate('/', { replace: true });
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Center h="100%" mih="100vh" p="md">
			<Stack w="100%" maw={360} gap="md">
				<Title order={2} ta="center">
					Авторизуйтесь
				</Title>
				<Text c="dimmed" ta="center" size="sm">
					Школа — вход по email
				</Text>
				<form
					onSubmit={form.onSubmit((values) => {
						void handleSubmit(values);
					})}
				>
					<Stack gap="sm">
						<TextInput
							label="Email"
							type="email"
							autoComplete="email"
							placeholder="user@example.com"
							{...form.getInputProps('username')}
						/>
						<PasswordInput
							label="Пароль"
							autoComplete="current-password"
							placeholder="Пароль"
							{...form.getInputProps('password')}
						/>
						<Button type="submit" fullWidth loading={loading}>
							Войти
						</Button>
					</Stack>
				</form>
			</Stack>
		</Center>
	);
}
