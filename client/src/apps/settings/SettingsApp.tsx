import { Alert, Button, Flex, Form, Input, Select, Spin, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef } from 'react';

import { updateAccount } from '@/core/api/endpoints/account';
import { queryKeys } from '@/core/api/queryKeys';
import {
	DATE_LOCALE_OPTIONS,
	DATE_TIME_FORMAT_OPTIONS,
	useDateSettings,
} from '@/core/dates';
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
	const { locale, timeFormat, setLocale, setTimeFormat, isLoading: datesLoading } = useDateSettings();
	const [form] = Form.useForm<ProfileFormValues>();

	useWindowTitle('Settings');

	const syncedAccountIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!account || syncedAccountIdRef.current === account.id) {
			return;
		}
		syncedAccountIdRef.current = account.id;
		form.setFieldsValue(toFormValues(account));
	}, [account, form]);

	const saveMutation = useMutation({
		mutationFn: (values: ProfileFormValues) => updateAccount(toUpdatePayload(values)),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.account.detail });
			coreApi.toast.success('Профиль сохранён');
			form.setFieldsValue({ password: '', confirm_password: '' });
		},
		onError: (err) => {
			if (isAxiosError<ApiError>(err) && err.response?.status === 400) {
				const data = err.response.data;
				if (data && typeof data === 'object') {
					const fieldErrors = Object.entries(data)
						.filter(([, message]) => typeof message === 'string')
						.map(([field, message]) => ({
							name: field as keyof ProfileFormValues,
							errors: [message as string],
						}));
					if (fieldErrors.length > 0) {
						form.setFields(fieldErrors);
					}
				}
				coreApi.toast.error('Проверьте введённые данные');
				return;
			}
			coreApi.toast.error('Не удалось сохранить профиль');
		},
	});

	if (isLoading || datesLoading) {
		return (
			<Flex align="center" justify="center" style={{ height: '100%', padding: 16 }}>
				<Spin size="small" />
			</Flex>
		);
	}

	if (isError) {
		const message = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
		return (
			<div style={{ padding: 16 }}>
				<Alert type="error" showIcon message="Ошибка" description={message} />
			</div>
		);
	}

	return (
		<div style={{ padding: 16 }}>
			<Flex vertical gap="middle">
				<Flex vertical gap="small">
					<Typography.Text strong>Дата и время</Typography.Text>
					<Form.Item label="Язык календаря" style={{ marginBottom: 0 }}>
						<Select
							options={[...DATE_LOCALE_OPTIONS]}
							value={locale}
							onChange={(value) => {
								if (value === 'ru' || value === 'en') {
									setLocale(value);
								}
							}}
						/>
					</Form.Item>
					<Form.Item label="Формат даты и времени" style={{ marginBottom: 0 }}>
						<Select
							options={[...DATE_TIME_FORMAT_OPTIONS]}
							value={timeFormat}
							onChange={(value) => {
								const option = DATE_TIME_FORMAT_OPTIONS.find((item) => item.value === value);
								if (option) {
									setTimeFormat(option.value);
								}
							}}
						/>
					</Form.Item>
				</Flex>

				<Typography.Text strong>Профиль</Typography.Text>
				<Form
					form={form}
					layout="vertical"
					onFinish={(values) => saveMutation.mutate(values)}
				>
					<Form.Item label="Email" name="email">
						<Input />
					</Form.Item>
					<Form.Item label="Alias" name="alias">
						<Input />
					</Form.Item>
					<Form.Item label="Фамилия" name="second_name">
						<Input />
					</Form.Item>
					<Form.Item label="Имя" name="first_name">
						<Input />
					</Form.Item>
					<Form.Item label="Отчество" name="patronymic">
						<Input />
					</Form.Item>
					<Form.Item label="Описание" name="description">
						<Input />
					</Form.Item>
					<Form.Item label="Новый пароль" name="password">
						<Input.Password />
					</Form.Item>
					<Form.Item label="Подтверждение пароля" name="confirm_password">
						<Input.Password />
					</Form.Item>
					<Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
						Сохранить профиль
					</Button>
				</Form>
			</Flex>
		</div>
	);
}
