import { useAccountsQuery } from '@inccom/entities/account';
import {
	useTransactionCreate,
	useTransactionQuery,
	useTransactionUpdate,
	type ITransaction,
	type ITransactionPayload,
	type TransactionType,
} from '@inccom/entities/transaction';
import { useTransactionCategoriesQuery } from '@inccom/entities/transaction-category';
import { QrScannerModal } from '@inccom/features/qr-scanner';
import type { ParsedFiscalQr } from '@inccom/shared/lib/parse-fiscal-qr';
import {
	calculateExpenseAmount,
	confirmNegativeBalance,
	getBalanceAfterDebit,
	willBalanceGoNegative,
} from '@inccom/shared/lib/negative-balance';
import { notification } from '@inccom/shared/notification';
import { getErrorMessage } from '@inccom/shared/utils/error';
import {
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	Switch,
	TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect, useMemo, useState } from 'react';
import { TransactionItemsEditor } from './TransactionItemsEditor';

interface TransactionFormValues {
	type: TransactionType;
	accountId: string | null;
	categoryId: string | null;
	amount: number | string;
	date: Date | null;
	comment: string;
	isManualAmount: boolean;
	fn: string;
	fpd: string;
	fp: string;
	fd: string;
	mcc: string;
	items: Array<{ itemId: number; quantity: string; price: string }>;
}

interface TransactionFormProps {
	id?: ITransaction['id'];
	type?: TransactionType;
	defaultAccountId?: number;
	onSuccess?: (transaction: ITransaction) => void;
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

export function TransactionForm({
	id,
	type = 'expense',
	defaultAccountId,
	onSuccess,
}: TransactionFormProps) {
	const [qrOpened, setQrOpened] = useState(false);
	const isExpense = type === 'expense';

	const form = useForm<TransactionFormValues>({
		initialValues: {
			type,
			accountId: defaultAccountId ? String(defaultAccountId) : null,
			categoryId: null,
			amount: 0,
			date: new Date(),
			comment: '',
			isManualAmount: false,
			fn: '',
			fpd: '',
			fp: '',
			fd: '',
			mcc: '',
			items: [],
		},
		validate: {
			accountId: isNotEmpty('Выберите счёт'),
			categoryId: isNotEmpty('Выберите категорию'),
			date: (value) => (value ? null : 'Укажите дату'),
			amount: (value, values) => {
				if (!isExpense || values.isManualAmount) {
					return Number(value) > 0 ? null : 'Укажите сумму';
				}
				return null;
			},
		},
	});

	const accountId = form.values.accountId ? Number(form.values.accountId) : 0;

	const { data: accountsData, isLoading: isAccountsLoading } = useAccountsQuery();
	const { data: categoriesData, isFetching: isCategoriesFetching } =
		useTransactionCategoriesQuery(
		{ accountId, limit: 100, offset: 0 },
		{ enabled: accountId > 0 },
	);
	const { data: transactionData } = useTransactionQuery(id);
	const createMutation = useTransactionCreate();
	const updateMutation = useTransactionUpdate();

	const accountOptions = useMemo(
		() =>
			(accountsData?.items ?? []).map((account) => ({
				value: String(account.id),
				label: account.label,
			})),
		[accountsData?.items],
	);

	const categoryOptions = useMemo(
		() =>
			(categoriesData?.items ?? [])
				.filter((category) => category.type === type)
				.sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))
				.map((category) => ({
					value: String(category.id),
					label: category.label,
				})),
		[categoriesData?.items, type],
	);

	useEffect(() => {
		if (accountId <= 0) {
			if (form.values.categoryId !== null) {
				form.setFieldValue('categoryId', null);
			}
			return;
		}

		if (isCategoriesFetching) {
			return;
		}

		if (categoryOptions.length === 0) {
			if (form.values.categoryId !== null) {
				form.setFieldValue('categoryId', null);
			}
			return;
		}

		const currentCategoryId = form.values.categoryId;
		const isCurrentValid = categoryOptions.some(
			(option) => option.value === currentCategoryId,
		);

		if (!isCurrentValid) {
			const firstCategory = categoryOptions[0];
			if (firstCategory) {
				form.setFieldValue('categoryId', firstCategory.value);
			}
		}
	}, [accountId, categoryOptions, isCategoriesFetching]);

	useEffect(() => {
		if (transactionData?.id && id) {
			form.setValues({
				type: transactionData.type,
				accountId: String(transactionData.accountId),
				categoryId: transactionData.categoryId
					? String(transactionData.categoryId)
					: null,
				amount: Number(transactionData.amount),
				date: toFormDate(transactionData.date),
				comment: transactionData.comment ?? '',
				isManualAmount: transactionData.isManualAmount,
				fn: transactionData.fn ?? '',
				fpd: transactionData.fpd ?? '',
				fp: transactionData.fp ?? '',
				fd: transactionData.fd ?? '',
				mcc: transactionData.mcc ?? '',
				items: transactionData.items.map((item) => ({
					itemId: item.itemId,
					quantity: item.quantity,
					price: item.price,
				})),
			});
			return;
		}

		if (!id && defaultAccountId) {
			form.setFieldValue('accountId', String(defaultAccountId));
		}
	}, [transactionData, id, defaultAccountId]);

	function applyQrData(data: ParsedFiscalQr) {
		if (data.fn) form.setFieldValue('fn', data.fn);
		if (data.fpd) form.setFieldValue('fpd', data.fpd);
		if (data.fp) form.setFieldValue('fp', data.fp);
		if (data.fd) form.setFieldValue('fd', data.fd);
		if (data.amount) form.setFieldValue('amount', Number(data.amount));
		if (data.date) form.setFieldValue('date', toFormDate(data.date));
	}

	function buildPayload(values: TransactionFormValues): ITransactionPayload {
		const payload: ITransactionPayload = {
			type,
			accountId: Number(values.accountId),
			categoryId: values.categoryId ? Number(values.categoryId) : null,
			date: toIsoDate(values.date),
			comment: values.comment || null,
		};

		if (isExpense) {
			payload.isManualAmount = values.isManualAmount;
			payload.fn = values.fn || null;
			payload.fpd = values.fpd || null;
			payload.fp = values.fp || null;
			payload.fd = values.fd || null;
			payload.mcc = values.mcc.trim() || null;

			if (values.isManualAmount) {
				payload.amount = Number(values.amount).toFixed(2);
			} else {
				payload.items = values.items
					.filter((item) => item.itemId > 0)
					.map((item) => ({
						itemId: item.itemId,
						quantity: item.quantity,
						price: Number(item.price).toFixed(2),
					}));
			}
		} else {
			payload.amount = Number(values.amount).toFixed(2);
		}

		return payload;
	}

	async function handleSubmit(values: TransactionFormValues) {
		const payload = buildPayload(values);

		if (isExpense) {
			const account = (accountsData?.items ?? []).find(
				(item) => item.id === Number(values.accountId),
			);

			if (account) {
				const debitAmount = calculateExpenseAmount(
					values.amount,
					values.isManualAmount,
					values.items,
				);
				const previousDebit =
					id &&
					transactionData?.accountId === Number(values.accountId)
						? Number(transactionData.amount)
						: 0;

				if (
					willBalanceGoNegative(account.balance, debitAmount, previousDebit)
				) {
					const projectedBalance = getBalanceAfterDebit(
						account.balance,
						debitAmount,
						previousDebit,
					);
					const confirmed = await confirmNegativeBalance({
						accountLabel: account.label,
						projectedBalance,
					});
					if (!confirmed) {
						return;
					}
				}
			}
		}

		try {
			const result = id
				? await updateMutation.mutateAsync({ id, ...payload })
				: await createMutation.mutateAsync(payload);

			notification.success(
				id ? 'Транзакция обновлена' : 'Транзакция создана',
			);
			onSuccess?.(result);
		} catch (e: unknown) {
			const error = getErrorMessage(e, 'Не удалось сохранить транзакцию');
			notification.error('Ошибка', error);
		}
	}

	const loading = createMutation.isPending || updateMutation.isPending;
	const isManualAmount = form.values.isManualAmount;

	const accountIdProps = form.getInputProps('accountId');
	const categoryIdProps = form.getInputProps('categoryId');

	return (
		<>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
				<Select
					label="Счёт"
					data={accountOptions}
					{...accountIdProps}
					searchable
					required
					placeholder={
						isAccountsLoading && !accountOptions.length
							? 'Загрузка…'
							: 'Выберите счёт'
					}
					nothingFoundMessage="Счета не найдены"
					w="100%"
				/>
				<Select
					label="Категория"
					data={categoryOptions}
					key={`category-${accountId}`}
					{...categoryIdProps}
					searchable
					required
					disabled={accountId <= 0}
					placeholder={accountId <= 0 ? 'Сначала выберите счёт' : 'Выберите категорию'}
					nothingFoundMessage="Категории не найдены"
					w="100%"
				/>
				<DateTimePicker
					label="Дата"
					{...form.getInputProps('date')}
					required
					w="100%"
				/>
				{isExpense ? (
					<>
						<Group>
							<Button variant="light" onClick={() => setQrOpened(true)}>
								Сканировать QR
							</Button>
						</Group>
						<TextInput
							label="ФН"
							{...form.getInputProps('fn')}
							w="100%"
						/>
						<TextInput
							label="ФПД"
							{...form.getInputProps('fpd')}
							w="100%"
						/>
						<TextInput
							label="ФП"
							{...form.getInputProps('fp')}
							w="100%"
						/>
						<TextInput
							label="ФД"
							{...form.getInputProps('fd')}
							w="100%"
						/>
						<TextInput
							label="MCC"
							description="Необязательно"
							placeholder="Код категории мерчанта"
							{...form.getInputProps('mcc')}
							w="100%"
						/>
						<Switch
							label="Ручной ввод суммы"
							{...form.getInputProps('isManualAmount', { type: 'checkbox' })}
						/>
						{isManualAmount ? (
							<NumberInput
								label="Сумма"
								decimalScale={2}
								min={0}
								{...form.getInputProps('amount')}
								required
								w="100%"
							/>
						) : (
							<TransactionItemsEditor
								items={form.values.items}
								onChange={(items) => form.setFieldValue('items', items)}
								disabled={loading}
							/>
						)}
					</>
				) : (
					<NumberInput
						label="Сумма"
						decimalScale={2}
						min={0}
						{...form.getInputProps('amount')}
						required
						w="100%"
					/>
				)}
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
			<QrScannerModal
				opened={qrOpened}
				onClose={() => setQrOpened(false)}
				onParsed={applyQrData}
			/>
		</>
	);
}
