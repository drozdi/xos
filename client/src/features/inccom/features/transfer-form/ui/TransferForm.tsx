import { Button, DatePicker, Flex, Form, Input, InputNumber, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';

import { useAccountsQuery } from '@inccom/entities/account';
import { useTransactionCategoriesQuery } from '@inccom/entities/transaction-category';
import type { ICategory } from '@inccom/entities/transaction-category/model/types';
import {
	useTransferCreate,
	useTransferQuery,
	useTransferUpdate,
	type ITransfer,
	type ITransferPayload,
} from '@inccom/entities/transfer';
import {
	confirmNegativeBalance,
	getBalanceAfterDebit,
	willBalanceGoNegative,
} from '@inccom/shared/lib/negative-balance';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import { formatBalance } from '@inccom/shared/utils/number-format';

interface TransferFormValues {
	fromAccountId: string | null;
	toAccountId: string | null;
	outgoingCategoryId: string | null;
	incomingCategoryId: string | null;
	amount: number;
	date: Dayjs | null;
	comment: string;
}

interface AccountSelectOption {
	value: string;
	label: string;
	currency: string;
}

interface TransferFormProps {
	id?: ITransfer['id'];
	defaultFromAccountId?: number;
	onSuccess?: (transfer: ITransfer) => void;
}

function toIsoDate(value: Dayjs | null): string {
	return (value ?? dayjs()).toISOString();
}

function toFormDate(value?: string | null): Dayjs {
	if (!value) {
		return dayjs();
	}
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed : dayjs();
}

export function TransferForm({
	id,
	defaultFromAccountId,
	onSuccess,
}: TransferFormProps) {
	const [form] = Form.useForm<TransferFormValues>();
	const fromAccountId = Form.useWatch('fromAccountId', form);
	const toAccountId = Form.useWatch('toAccountId', form);

	const { data: accountsData, isLoading: isAccountsLoading } = useAccountsQuery();
	const { data: transferData } = useTransferQuery(id);
	const createMutation = useTransferCreate();
	const updateMutation = useTransferUpdate();

	const accounts = accountsData?.items ?? [];
	const fromAccountIdNum = fromAccountId ? Number(fromAccountId) : 0;
	const toAccountIdNum = toAccountId ? Number(toAccountId) : 0;
	const { data: fromCategoriesData, isFetching: isFromCategoriesFetching } =
		useTransactionCategoriesQuery(
			{ accountId: fromAccountIdNum, limit: 100, offset: 0 },
			{ enabled: fromAccountIdNum > 0 },
		);
	const { data: toCategoriesData, isFetching: isToCategoriesFetching } =
		useTransactionCategoriesQuery(
			{ accountId: toAccountIdNum, limit: 100, offset: 0 },
			{ enabled: toAccountIdNum > 0 },
		);

	const accountOptions = useMemo<AccountSelectOption[]>(
		() =>
			accounts.map((account) => ({
				value: String(account.id),
				label: `${account.label} (${formatBalance(account.balance)} ${account.currency})`,
				currency: account.currency,
			})),
		[accounts],
	);

	const fromCurrency = accounts.find(
		(account) => String(account.id) === fromAccountId,
	)?.currency;

	const fromAccountOptions = useMemo(
		() => accountOptions.filter((option) => option.value !== toAccountId),
		[accountOptions, toAccountId],
	);

	const toAccountOptions = useMemo(() => {
		return accountOptions.filter((option) => {
			if (option.value === fromAccountId) {
				return false;
			}
			if (!fromCurrency) {
				return true;
			}
			return option.currency === fromCurrency;
		});
	}, [accountOptions, fromAccountId, fromCurrency]);

	const transferCategoryOptions = (items: ICategory[] | undefined) =>
		(items ?? [])
			.filter((category) => category.type === 'transfer')
			.sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))
			.map((category) => ({
				value: String(category.id),
				label: category.label,
			}));

	const outgoingCategoryOptions = useMemo(
		() => transferCategoryOptions(fromCategoriesData?.items),
		[fromCategoriesData?.items],
	);

	const incomingCategoryOptions = useMemo(
		() => transferCategoryOptions(toCategoriesData?.items),
		[toCategoriesData?.items],
	);

	useEffect(() => {
		if (id && transferData?.id) {
			form.setFieldsValue({
				fromAccountId: String(transferData.fromAccountId),
				toAccountId: String(transferData.toAccountId),
				outgoingCategoryId: transferData.outgoingCategoryId
					? String(transferData.outgoingCategoryId)
					: null,
				incomingCategoryId: transferData.incomingCategoryId
					? String(transferData.incomingCategoryId)
					: null,
				amount: Number(transferData.amount),
				date: toFormDate(transferData.date),
				comment: transferData.comment ?? '',
			});
			return;
		}

		if (!id && defaultFromAccountId) {
			form.setFieldValue('fromAccountId', String(defaultFromAccountId));
		}
	}, [transferData, id, defaultFromAccountId, form]);

	useEffect(() => {
		if (!fromAccountId || !toAccountId) {
			return;
		}

		const toAccount = accounts.find(
			(account) => String(account.id) === toAccountId,
		);

		if (toAccount && fromCurrency && toAccount.currency !== fromCurrency) {
			form.setFieldValue('toAccountId', null);
			form.setFieldValue('incomingCategoryId', null);
		}
	}, [fromAccountId, fromCurrency, toAccountId, accounts, form]);

	useEffect(() => {
		if (fromAccountIdNum <= 0 || isFromCategoriesFetching) {
			return;
		}

		const categoryId = form.getFieldValue('outgoingCategoryId');
		if (
			categoryId &&
			!outgoingCategoryOptions.some((option) => option.value === categoryId)
		) {
			form.setFieldValue('outgoingCategoryId', null);
		}
	}, [
		fromAccountIdNum,
		isFromCategoriesFetching,
		outgoingCategoryOptions,
		form,
	]);

	useEffect(() => {
		if (toAccountIdNum <= 0 || isToCategoriesFetching) {
			return;
		}

		const categoryId = form.getFieldValue('incomingCategoryId');
		if (
			categoryId &&
			!incomingCategoryOptions.some((option) => option.value === categoryId)
		) {
			form.setFieldValue('incomingCategoryId', null);
		}
	}, [toAccountIdNum, isToCategoriesFetching, incomingCategoryOptions, form]);

	async function handleSubmit(values: TransferFormValues) {
		if (values.fromAccountId === values.toAccountId) {
			notification.error('Ошибка', 'Счета должны отличаться');
			return;
		}

		const fromAccount = accounts.find(
			(account) => String(account.id) === values.fromAccountId,
		);
		const toAccount = accounts.find(
			(account) => String(account.id) === values.toAccountId,
		);

		if (
			fromAccount &&
			toAccount &&
			fromAccount.currency !== toAccount.currency
		) {
			notification.error(
				'Ошибка',
				'Перевод возможен только между счетами с одной валютой',
			);
			return;
		}

		const payload: ITransferPayload = {
			fromAccountId: Number(values.fromAccountId),
			toAccountId: Number(values.toAccountId),
			amount: Number(values.amount).toFixed(2),
			date: toIsoDate(values.date),
			comment: values.comment || null,
			outgoingCategoryId: values.outgoingCategoryId
				? Number(values.outgoingCategoryId)
				: null,
			incomingCategoryId: values.incomingCategoryId
				? Number(values.incomingCategoryId)
				: null,
		};

		if (fromAccount) {
			const debitAmount = Number(values.amount);
			const previousDebit =
				id && transferData?.fromAccountId === Number(values.fromAccountId)
					? Number(transferData.amount)
					: 0;

			if (willBalanceGoNegative(fromAccount.balance, debitAmount, previousDebit)) {
				const projectedBalance = getBalanceAfterDebit(
					fromAccount.balance,
					debitAmount,
					previousDebit,
				);
				const confirmed = await confirmNegativeBalance({
					accountLabel: fromAccount.label,
					projectedBalance,
				});
				if (!confirmed) {
					return;
				}
			}
		}

		try {
			const result = id
				? await updateMutation.mutateAsync({ id, ...payload })
				: await createMutation.mutateAsync(payload);

			notification.success(id ? 'Перевод обновлён' : 'Перевод создан');
			onSuccess?.(result);
		} catch (e: unknown) {
			const error = getErrorMessage(e, 'Не удалось сохранить перевод');
			notification.error('Ошибка', error);
		}
	}

	const loading = createMutation.isPending || updateMutation.isPending;

	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={(v) => void handleSubmit(v)}
			initialValues={{
				fromAccountId: defaultFromAccountId
					? String(defaultFromAccountId)
					: null,
				toAccountId: null,
				outgoingCategoryId: null,
				incomingCategoryId: null,
				amount: 0,
				date: dayjs(),
				comment: '',
			}}
		>
			<Form.Item
				label="Счёт списания"
				name="fromAccountId"
				rules={[{ required: true, message: 'Выберите счёт списания' }]}
			>
				<Select
					showSearch
					optionFilterProp="label"
					options={fromAccountOptions}
					placeholder={
						isAccountsLoading && !fromAccountOptions.length
							? 'Загрузка…'
							: 'Выберите счёт'
					}
					notFoundContent="Счета не найдены"
					onChange={(value) => {
						form.setFieldsValue({
							fromAccountId: value,
							toAccountId: null,
							outgoingCategoryId: null,
							incomingCategoryId: null,
						});
					}}
				/>
			</Form.Item>
			<Form.Item
				label="Счёт зачисления"
				name="toAccountId"
				rules={[{ required: true, message: 'Выберите счёт зачисления' }]}
			>
				<Select
					showSearch
					optionFilterProp="label"
					options={toAccountOptions}
					disabled={!fromAccountId}
					placeholder={
						!fromAccountId
							? 'Сначала выберите счёт списания'
							: isAccountsLoading && !toAccountOptions.length
								? 'Загрузка…'
								: fromCurrency
									? `Счета в ${fromCurrency}`
									: 'Выберите счёт'
					}
					notFoundContent={
						fromCurrency
							? `Нет других счетов в валюте ${fromCurrency}`
							: 'Счета не найдены'
					}
				/>
			</Form.Item>
			<Form.Item label="Категория списания" name="outgoingCategoryId">
				<Select
					showSearch
					allowClear
					optionFilterProp="label"
					options={outgoingCategoryOptions}
					disabled={!fromAccountId}
					placeholder={
						!fromAccountId
							? 'Сначала выберите счёт списания'
							: outgoingCategoryOptions.length
								? 'Выберите категорию'
								: 'Нет категорий перевода'
					}
					notFoundContent="Категории не найдены"
				/>
			</Form.Item>
			<Form.Item label="Категория зачисления" name="incomingCategoryId">
				<Select
					showSearch
					allowClear
					optionFilterProp="label"
					options={incomingCategoryOptions}
					disabled={!toAccountId}
					placeholder={
						!toAccountId
							? 'Сначала выберите счёт зачисления'
							: incomingCategoryOptions.length
								? 'Выберите категорию'
								: 'Нет категорий перевода'
					}
					notFoundContent="Категории не найдены"
				/>
			</Form.Item>
			<Form.Item
				label="Сумма"
				name="amount"
				rules={[{ required: true, message: 'Укажите сумму' }]}
			>
				<InputNumber min={0} precision={2} style={{ width: '100%' }} />
			</Form.Item>
			<Form.Item
				label="Дата"
				name="date"
				rules={[{ required: true, message: 'Укажите дату' }]}
			>
				<DatePicker showTime style={{ width: '100%' }} />
			</Form.Item>
			<Form.Item label="Комментарий" name="comment">
				<Input />
			</Form.Item>
			<Flex>
				<Button type="primary" htmlType="submit" loading={loading}>
					{id ? 'Сохранить' : 'Создать'}
				</Button>
			</Flex>
		</Form>
	);
}
