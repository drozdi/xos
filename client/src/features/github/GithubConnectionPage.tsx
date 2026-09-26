import { Alert, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';

import {
	useGithubConnectionTest,
	useGithubCredentialsDelete,
	useGithubCredentialsQuery,
	useGithubCredentialsSave,
} from './api/queries';

export function GithubConnectionPage() {
	const credentialsQuery = useGithubCredentialsQuery();
	const saveMutation = useGithubCredentialsSave();
	const deleteMutation = useGithubCredentialsDelete();
	const testMutation = useGithubConnectionTest();
	const configured = Boolean(credentialsQuery.data?.configured);

	const form = useForm({
		initialValues: {
			access_token: '',
			default_owner: '',
			default_repo: '',
		},
		validate: {
			access_token: (value) =>
				configured || value.trim() ? null : 'Укажите Personal Access Token',
			default_owner: isNotEmpty('Укажите owner (org/user)'),
			default_repo: isNotEmpty('Укажите repository'),
		},
	});

	useEffect(() => {
		const data = credentialsQuery.data;
		if (!data) {
			return;
		}
		form.setValues({
			access_token: '',
			default_owner: data.default_owner || '',
			default_repo: data.default_repo || '',
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- sync when loaded
	}, [
		credentialsQuery.data?.default_owner,
		credentialsQuery.data?.default_repo,
		credentialsQuery.data?.configured,
	]);

	async function handleSave(values: typeof form.values) {
		try {
			await saveMutation.mutateAsync({
				access_token: values.access_token.trim(),
				default_owner: values.default_owner.trim() || null,
				default_repo: values.default_repo.trim() || null,
			});
			form.setFieldValue('access_token', '');
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
			form.setValues({ access_token: '', default_owner: '', default_repo: '' });
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
				message: result.login
					? `${result.message} (@${result.login})`
					: result.message,
			});
			if (result.ok) {
				void credentialsQuery.refetch();
			}
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Ошибка проверки',
			});
		}
	}

	return (
		<Stack m="md" maw={520} gap="md">
			{credentialsQuery.data?.encryption === false ? (
				<Alert color="yellow" title="Шифрование выключено">
					Задайте GITHUB_TOKEN_SECRET на сервере для хранения PAT в зашифрованном виде.
				</Alert>
			) : null}
			{configured ? (
				<Text size="sm" c="dimmed">
					Токен: {credentialsQuery.data?.access_token_masked || '••••'}
					{credentialsQuery.data?.github_login
						? ` · @${credentialsQuery.data.github_login}`
						: ''}
				</Text>
			) : null}
			<form onSubmit={form.onSubmit(handleSave)}>
				<Stack gap="sm">
					<TextInput
						label="Personal Access Token"
						placeholder={configured ? 'Оставьте пустым, чтобы не менять' : 'ghp_…'}
						type="password"
						autoComplete="off"
						{...form.getInputProps('access_token')}
					/>
					<TextInput
						label="Owner"
						placeholder="org или user"
						required
						{...form.getInputProps('default_owner')}
					/>
					<TextInput
						label="Repository"
						placeholder="repo"
						required
						{...form.getInputProps('default_repo')}
					/>
					<Group>
						<Button type="submit" loading={saveMutation.isPending}>
							Сохранить
						</Button>
						<Button
							variant="light"
							onClick={() => void handleTest()}
							loading={testMutation.isPending}
							disabled={!configured && !form.values.access_token.trim()}
						>
							Проверить
						</Button>
						{configured ? (
							<Button
								color="red"
								variant="subtle"
								onClick={() => void handleDelete()}
								loading={deleteMutation.isPending}
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
