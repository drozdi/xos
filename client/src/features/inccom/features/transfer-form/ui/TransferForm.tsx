import { useAccountsQuery } from '@inccom/entities/account';
import {
	useTransferCreate,
	useTransferQuery,
	useTransferUpdate,
	type ITransfer,
	type ITransferPayload,
} from '@inccom/entities/transfer';
import { notification } from '@inccom/shared/notification';
import {
	confirmNegativeBalance,
	getBalanceAfterDebit,
	willBalanceGoNegative,
} from '@inccom/shared/lib/negative-balance';
import { balanceInputProps, formatBalance } from '@inccom/shared/utils/number-format';
import { getErrorMessage } from '@inccom/shared/utils/error';
import {
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect, useMemo } from 'react';

interface TransferFormValues {
	fromAccountId: string | null;
	toAccountId: string | null;
	amount: number | string;
	date: Date | null;
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

function toIsoDate(value: Date | null): string {
	return (value ?? new Date()).toISOString();
}

function toFormDate(value?: string | null): Date | null {
	if (!value) {
		return new Date();
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function TransferForm({
	id,
	defaultFromAccountId,
	onSuccess,
}: TransferFormProps) {
	const form = useForm<TransferFormValues>({
		initialValues: {
			fromAccountId: defaultFromAccountId
				? String(defaultFromAccountId)
				: null,
			toAccountId: null,
			amount: 0,
			date: new Date(),
			comment: '',
		},
		validate: {
			fromAccountId: isNotEmpty('Выберите счёт списания'),
			toAccountId: isNotEmpty('Выберите счёт зачисления'),
			amount: (value) => (Number(value) > 0 ? null : 'Укажите сумму'),
			date: (value) => (value ? null : 'Укажите дату'),
		},
	});

	const { data: accountsData, isLoading: isAccountsLoading } = useAccountsQuery();
	const { data: transferData } = useTransferQuery(id);
	const createMutation = useTransferCreate();
	const updateMutation = useTransferUpdate();

	const accounts = accountsData?.items ?? [];
	const fromAccountId = form.values.fromAccountId;
	const toAccountId = form.values.toAccountId;

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

	useEffect(() => {
		if (id && transferData?.id) {
			form.setValues({
				fromAccountId: String(transferData.fromAccountId),
				toAccountId: String(transferData.toAccountId),
				amount: Number(transferData.amount),
				date: toFormDate(transferData.date),
				comment: transferData.comment ?? '',
			});
			return;
		}

		if (!id && defaultFromAccountId) {
			form.setFieldValue('fromAccountId', String(defaultFromAccountId));
		}
	}, [transferData, id, defaultFromAccountId]);

	useEffect(() => {
		if (!fromAccountId || !toAccountId) {
			return;
		}

		const toAccount = accounts.find(
			(account) => String(account.id) === toAccountId,
		);

		if (toAccount && fromCurrency && toAccount.currency !== fromCurrency) {
			form.setFieldValue('toAccountId', null);
		}
	}, [fromAccountId, fromCurrency, toAccountId, accounts]);

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
	const fromAccountProps = form.getInputProps('fromAccountId');
	const toAccountProps = form.getInputProps('toAccountId');

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack>
			<Select
				label="Счёт списания"
				data={fromAccountOptions}
				{...fromAccountProps}
				onChange={(value) => {
					fromAccountProps.onChange(value);
					form.setFieldValue('toAccountId', null);
				}}
				searchable
				required
				placeholder={
					isAccountsLoading && !fromAccountOptions.length
						? 'Загрузка…'
						: 'Выберите счёт'
				}
				nothingFoundMessage="Счета не найдены"
				w="100%"
			/>
			<Select
				label="Счёт зачисления"
				data={toAccountOptions}
				{...toAccountProps}
				searchable
				required
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
				nothingFoundMessage={
					fromCurrency
						? `Нет других счетов в валюте ${fromCurrency}`
						: 'Счета не найдены'
				}
				w="100%"
			/>
			<NumberInput
				label="Сумма"
				min={0}
				{...form.getInputProps('amount')}
				{...balanceInputProps}
				required
				w="100%"
			/>
			<DateTimePicker
				label="Дата"
				{...form.getInputProps('date')}
				required
				w="100%"
			/>
			<TextInput
				label="Комментарий"
				{...form.getInputProps('comment')}
				w="100%"
			/>
			<Group>
				<Button type="submit" loading={loading} color="green">
					{id ? 'Сохранить' : 'Создать'}
				</Button>
			</Group>
			</Stack>
		</form>
	);
}
