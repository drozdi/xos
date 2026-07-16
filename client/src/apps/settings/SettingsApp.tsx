import { Alert, Button, Loader, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef } from 'react';

import { updateAccount } from '@/core/api/endpoints/account';
import { queryKeys } from '@/core/api/queryKeys';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import type { AccountUpdateRequest, ApiError } from '@/types/api.types';

import { useAccount } from './hooks/useAccount';

interface ProfileFormValues {
	email: string;
	alias: string;
	second_name: string;
	first_name: string;
	patronymic: string;
	description: string;
	password: string;
	confirm_password: string;
}

function toFormValues(account: {
	email: string | null;
	alias: string | null;
	second_name: string | null;
	first_name: string | null;
	patronymic: string | null;
	description: string | null;
}): ProfileFormValues {
	return {
		email: account.email ?? '',
		alias: account.alias ?? '',
		second_name: account.second_name ?? '',
		first_name: account.first_name ?? '',
		patronymic: account.patronymic ?? '',
		description: account.description ?? '',
		password: '',
		confirm_password: '',
	};
}

function toUpdatePayload(values: ProfileFormValues): AccountUpdateRequest {
	const payload: AccountUpdateRequest = {
		email: values.email || null,
		alias: values.alias,
		second_name: values.second_name,
		first_name: values.first_name,
		patronymic: values.patronymic,
		description: values.description,
	};

	if (values.password) {
		payload.password = values.password;
		payload.confirm_password = values.confirm_password;
	}

	return payload;
}

export default function SettingsApp() {
	const coreApi = useCoreApi();
	const queryClient = useQueryClient();
	const { data: account, isLoading, isError, error } = useAccount();

	const form = useForm<ProfileFormValues>({
		mode: 'uncontrolled',
		initialValues: {
			email: '',
			alias: '',
			second_name: '',
			first_name: '',
			patronymic: '',
			description: '',
			password: '',
			confirm_password: '',
		},
	});

	useWindowTitle('Settings');

	const syncedAccountIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!account || syncedAccountIdRef.current === account.id) {
			return;
		}
		syncedAccountIdRef.current = account.id;
		form.setValues(toFormValues(account));
	}, [account, form]);

	const saveMutation = useMutation({
		mutationFn: (values: ProfileFormValues) => updateAccount(toUpdatePayload(values)),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.account.detail });
			coreApi.toast.success('Профиль сохранён');
			form.setFieldValue('password', '');
			form.setFieldValue('confirm_password', '');
		},
		onError: (err) => {
			if (isAxiosError<ApiError>(err) && err.response?.status === 400) {
				const data = err.response.data;
				if (data && typeof data === 'object') {
					for (const [field, message] of Object.entries(data)) {
						if (typeof message === 'string' && field in form.values) {
							form.setFieldError(field as keyof ProfileFormValues, message);
						}
					}
				}
				coreApi.toast.error('Проверьте введённые данные');
				return;
			}
			coreApi.toast.error('Не удалось сохранить профиль');
		},
	});

	const handleSubmit = form.onSubmit((values) => {
		saveMutation.mutate(values);
	});

	if (isLoading) {
		return (
			<Stack align="center" justify="center" h="100%" p="md">
				<Loader size="sm" />
			</Stack>
		);
	}

	if (isError) {
		const message = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
		return (
			<Stack p="md">
				<Alert color="red" title="Ошибка">
					{message}
				</Alert>
			</Stack>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack p="md" gap="sm">
				<TextInput label="Email" key={form.key('email')} {...form.getInputProps('email')} />
				<TextInput label="Alias" key={form.key('alias')} {...form.getInputProps('alias')} />
				<TextInput
					label="Фамилия"
					key={form.key('second_name')}
					{...form.getInputProps('second_name')}
				/>
				<TextInput
					label="Имя"
					key={form.key('first_name')}
					{...form.getInputProps('first_name')}
				/>
				<TextInput
					label="Отчество"
					key={form.key('patronymic')}
					{...form.getInputProps('patronymic')}
				/>
				<TextInput
					label="Описание"
					key={form.key('description')}
					{...form.getInputProps('description')}
				/>
				<PasswordInput
					label="Новый пароль"
					key={form.key('password')}
					{...form.getInputProps('password')}
				/>
				<PasswordInput
					label="Подтверждение пароля"
					key={form.key('confirm_password')}
					{...form.getInputProps('confirm_password')}
				/>
				<Button type="submit" loading={saveMutation.isPending}>
					Сохранить
				</Button>
			</Stack>
		</form>
	);
}
