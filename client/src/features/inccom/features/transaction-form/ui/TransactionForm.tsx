import { Button, DatePicker, Flex, Form, Input, InputNumber, Select, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

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

import { TransactionItemsEditor } from './TransactionItemsEditor';

interface TransactionFormValues {
	type: TransactionType;
	accountId: string | null;
	categoryId: string | null;
	amount: number;
	date: Dayjs | null;
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

export function TransactionForm({
	id,
	type = 'expense',
	defaultAccountId,
	onSuccess,
}: TransactionFormProps) {
	const [qrOpened, setQrOpened] = useState(false);
	const isExpense = type === 'expense';
	const [form] = Form.useForm<TransactionFormValues>();

	const accountIdRaw = Form.useWatch('accountId', form);
	const isManualAmount = Form.useWatch('isManualAmount', form);
	const accountId = accountIdRaw ? Number(accountIdRaw) : 0;

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
			if (form.getFieldValue('categoryId') !== null) {
				form.setFieldValue('categoryId', null);
			}
			return;
		}

		if (isCategoriesFetching) {
			return;
		}

		if (categoryOptions.length === 0) {
			if (form.getFieldValue('categoryId') !== null) {
				form.setFieldValue('categoryId', null);
			}
			return;
		}

		const currentCategoryId = form.getFieldValue('categoryId');
		const isCurrentValid = categoryOptions.some(
			(option) => option.value === currentCategoryId,
		);

		if (!isCurrentValid) {
			const firstCategory = categoryOptions[0];
			if (firstCategory) {
				form.setFieldValue('categoryId', firstCategory.value);
			}
		}
	}, [accountId, categoryOptions, isCategoriesFetching, form]);

	useEffect(() => {
		if (transactionData?.id && id) {
			form.setFieldsValue({
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
	}, [transactionData, id, defaultAccountId, form]);

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
					id && transactionData?.accountId === Number(values.accountId)
						? Number(transactionData.amount)
						: 0;

				if (willBalanceGoNegative(account.balance, debitAmount, previousDebit)) {
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

			notification.success(id ? 'Транзакция обновлена' : 'Транзакция создана');
			onSuccess?.(result);
		} catch (e: unknown) {
			const error = getErrorMessage(e, 'Не удалось сохранить транзакцию');
			notification.error('Ошибка', error);
		}
	}

	const loading = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Form
				form={form}
				layout="vertical"
				onFinish={(v) => void handleSubmit(v)}
				initialValues={{
					type,
					accountId: defaultAccountId ? String(defaultAccountId) : null,
					categoryId: null,
					amount: 0,
					date: dayjs(),
					comment: '',
					isManualAmount: false,
					fn: '',
					fpd: '',
					fp: '',
					fd: '',
					mcc: '',
					items: [],
				}}
			>
				<Form.Item
					label="Счёт"
					name="accountId"
					rules={[{ required: true, message: 'Выберите счёт' }]}
				>
					<Select
						showSearch
						optionFilterProp="label"
						options={accountOptions}
						placeholder={
							isAccountsLoading && !accountOptions.length
								? 'Загрузка…'
								: 'Выберите счёт'
						}
						notFoundContent="Счета не найдены"
					/>
				</Form.Item>
				<Form.Item
					label="Категория"
					name="categoryId"
					rules={[{ required: true, message: 'Выберите категорию' }]}
				>
					<Select
						key={`category-${accountId}`}
						showSearch
						optionFilterProp="label"
						options={categoryOptions}
						disabled={accountId <= 0}
						placeholder={
							accountId <= 0 ? 'Сначала выберите счёт' : 'Выберите категорию'
						}
						notFoundContent="Категории не найдены"
					/>
				</Form.Item>
				<Form.Item
					label="Дата"
					name="date"
					rules={[{ required: true, message: 'Укажите дату' }]}
				>
					<DatePicker showTime style={{ width: '100%' }} />
				</Form.Item>
				{isExpense ? (
					<>
						<Button type="default" onClick={() => setQrOpened(true)} style={{ marginBottom: 16 }}>
							Сканировать QR
						</Button>
						<Form.Item label="ФН" name="fn">
							<Input />
						</Form.Item>
						<Form.Item label="ФПД" name="fpd">
							<Input />
						</Form.Item>
						<Form.Item label="ФП" name="fp">
							<Input />
						</Form.Item>
						<Form.Item label="ФД" name="fd">
							<Input />
						</Form.Item>
						<Form.Item label="MCC" name="mcc" extra="Необязательно">
							<Input placeholder="Код категории мерчанта" />
						</Form.Item>
						<Form.Item name="isManualAmount" valuePropName="checked" label="Ручной ввод суммы">
							<Switch />
						</Form.Item>
						{isManualAmount ? (
							<Form.Item
								label="Сумма"
								name="amount"
								rules={[{ required: true, message: 'Укажите сумму' }]}
							>
								<InputNumber min={0} precision={2} style={{ width: '100%' }} />
							</Form.Item>
						) : (
							<Form.Item name="items">
								<TransactionItemsEditor disabled={loading} />
							</Form.Item>
						)}
					</>
				) : (
					<Form.Item
						label="Сумма"
						name="amount"
						rules={[{ required: true, message: 'Укажите сумму' }]}
					>
						<InputNumber min={0} precision={2} style={{ width: '100%' }} />
					</Form.Item>
				)}
				<Form.Item label="Комментарий" name="comment">
					<Input />
				</Form.Item>
				<Flex>
					<Button type="primary" htmlType="submit" loading={loading}>
						{id ? 'Сохранить' : 'Создать'}
					</Button>
				</Flex>
			</Form>
			<QrScannerModal
				opened={qrOpened}
				onClose={() => setQrOpened(false)}
				onParsed={applyQrData}
			/>
		</>
	);
}
