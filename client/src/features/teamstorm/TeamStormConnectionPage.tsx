import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';

import {
	useTsConnectionTest,
	useTsCredentialsDelete,
	useTsCredentialsQuery,
	useTsCredentialsSave,
} from './api/queries';

export function TeamStormConnectionPage() {
	const credentialsQuery = useTsCredentialsQuery();
	const saveMutation = useTsCredentialsSave();
	const deleteMutation = useTsCredentialsDelete();
	const testMutation = useTsConnectionTest();
	const configured = Boolean(credentialsQuery.data?.configured);

	const form = useForm({
		initialValues: {
			base_url: '',
			private_token: '',
			ts_username: '',
		},
		validate: {
			base_url: isNotEmpty('Укажите URL инстанса TeamStorm'),
			private_token: (value) =>
				configured || value.trim()
					? null
					: 'Укажите PrivateToken',
		},
	});

	useEffect(() => {
		const data = credentialsQuery.data;
		if (!data) {
			return;
		}
		form.setValues({
			base_url: data.base_url || '',
			private_token: '',
			ts_username: data.ts_username || '',
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- sync when loaded
	}, [
		credentialsQuery.data?.base_url,
		credentialsQuery.data?.configured,
		credentialsQuery.data?.ts_username,
	]);

	async function handleSave(values: typeof form.values) {
		try {
			await saveMutation.mutateAsync({
				base_url: values.base_url.trim(),
				private_token: values.private_token.trim(),
				ts_username: values.ts_username.trim() || null,
			});
			form.setFieldValue('private_token', '');
			notifications.show({ color: 'green', message: 'Данные связи сохранены' });
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось сохранить',
			});
		}
	}

	async function handleDelete() {
		try {
			await deleteMutation.mutateAsync();
			form.setValues({ base_url: '', private_token: '', ts_username: '' });
			notifications.show({ color: 'green', message: 'Связь сброшена' });
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось сбросить',
			});
		}
	}

	async function handleTest() {
		try {
			const result = await testMutation.mutateAsync();
			notifications.show({
				color: result.ok ? 'green' : 'red',
				message: result.message,
			});
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Ошибка проверки',
			});
		}
	}

	return (
		<Stack gap="md" maw={560} p="md">
			<Text fw={600} size="lg">
				Связь с TeamStorm
			</Text>
			<Text size="sm" c="dimmed">
				Укажите URL On‑Premise инстанса и PrivateToken из профиля TeamStorm. Логин TS нужен
				для фильтра «Мои задачи» (иначе сопоставление по email/login XOS).
			</Text>
			{configured ? (
				<Alert color="green" title="Настроено">
					Токен: {credentialsQuery.data?.private_token_masked}
					{credentialsQuery.data?.ts_username
						? ` · логин TS: ${credentialsQuery.data.ts_username}`
						: null}
					{credentialsQuery.data?.encryption ? ' · шифрование at rest включено' : null}
				</Alert>
			) : (
				<Alert color="yellow" title="Не настроено">
					Сохраните base URL и PrivateToken.
				</Alert>
			)}
			<form onSubmit={form.onSubmit((values) => void handleSave(values))}>
				<Stack gap="sm">
					<TextInput
						label="Base URL"
						placeholder="https://teamstorm.example.com"
						description="Без завершающего слэша"
						{...form.getInputProps('base_url')}
					/>
					<TextInput
						label="PrivateToken"
						type="password"
						description={
							configured
								? 'Оставьте пустым, чтобы не менять токен'
								: 'Из профиля TeamStorm'
						}
						{...form.getInputProps('private_token')}
					/>
					<TextInput
						label="Логин TeamStorm"
						placeholder="ivan.ivanov"
						description="Для списка «Мои задачи» (assignee)"
						{...form.getInputProps('ts_username')}
					/>
					<Group>
						<Button type="submit" loading={saveMutation.isPending}>
							Сохранить
						</Button>
						<Button
							variant="light"
							loading={testMutation.isPending}
							disabled={!configured}
							onClick={() => void handleTest()}
						>
							Проверить связь
						</Button>
						{configured ? (
							<Button
								variant="subtle"
								color="red"
								loading={deleteMutation.isPending}
								onClick={() => void handleDelete()}
							>
								Сбросить
							</Button>
						) : null}
					</Group>
				</Stack>
			</form>
		</Stack>
	);
}
