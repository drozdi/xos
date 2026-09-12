import {
	useFnsCredentialsDelete,
	useFnsCredentialsQuery,
	useFnsCredentialsSave,
} from '@inccom/entities/fns';
import { Template } from '@inccom/layouts';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect } from 'react';

export function FnsSettingsPage() {
	const credentialsQuery = useFnsCredentialsQuery();
	const saveMutation = useFnsCredentialsSave();
	const deleteMutation = useFnsCredentialsDelete();

	const form = useForm({
		initialValues: {
			server: 'https://openapi.nalog.ru:8090',
			username: '',
			master_token: '',
		},
		validate: {
			server: isNotEmpty('Укажите URL сервера'),
			username: isNotEmpty('Укажите username'),
			master_token: isNotEmpty('Укажите master token'),
		},
	});

	useEffect(() => {
		const data = credentialsQuery.data;
		if (!data) {
			return;
		}
		form.setValues({
			server: data.server || 'https://openapi.nalog.ru:8090',
			username: data.username || '',
			master_token: '',
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- sync once when loaded
	}, [credentialsQuery.data?.server, credentialsQuery.data?.username]);

	async function handleSave(values: typeof form.values) {
		try {
			await saveMutation.mutateAsync({
				server: values.server.trim(),
				username: values.username.trim(),
				master_token: values.master_token.trim(),
			});
			form.setFieldValue('master_token', '');
			notification.success('Сохранено', 'Данные ФНС обновлены');
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	async function handleDelete() {
		try {
			await deleteMutation.mutateAsync();
			form.setValues({
				server: 'https://openapi.nalog.ru:8090',
				username: '',
				master_token: '',
			});
			notification.success('Удалено', 'Данные ФНС сброшены');
		} catch (error) {
			notification.error('Ошибка', getErrorMessage(error));
		}
	}

	return (
		<>
			<Template.Title>ФНС / проверка чеков</Template.Title>
			<Stack gap="md" maw={520}>
				<Text size="sm" c="dimmed">
					Укажите свои учётные данные OpenAPI ФНС. Без них проверка чеков недоступна.
				</Text>
				{credentialsQuery.data?.configured ? (
					<Alert color="green" title="Настроено">
						Токен: {credentialsQuery.data.master_token_masked}
					</Alert>
				) : (
					<Alert color="yellow" title="Не настроено">
						Сохраните server, username и master token.
					</Alert>
				)}
				<form onSubmit={form.onSubmit(handleSave)}>
					<Stack gap="sm">
						<TextInput
							label="Server"
							placeholder="https://openapi.nalog.ru:8090"
							{...form.getInputProps('server')}
						/>
						<TextInput label="Username" {...form.getInputProps('username')} />
						<TextInput
							label="Master token"
							type="password"
							description={
								credentialsQuery.data?.configured
									? 'Оставьте пустым нельзя — введите новый токен для обновления'
									: undefined
							}
							{...form.getInputProps('master_token')}
						/>
						<Group>
							<Button type="submit" loading={saveMutation.isPending}>
								Сохранить
							</Button>
							{credentialsQuery.data?.configured ? (
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
		</>
	);
}
