import type { TransactionType } from '@inccom/entities/transaction';
import { TransactionForm } from '@inccom/features/transaction-form';
import { TransferForm } from '@inccom/features/transfer-form';
import { Template } from '@inccom/layouts';
import { TransactionTableWidget } from '@inccom/widgets';
import { Button, Group, Select, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
	parseAccountIdParam,
	parseTransactionType,
	transactionNewUrl,
	transferNewUrl,
} from '@inccom/shared/lib/transaction-url';

export function TransactionsListPage() {
	const { id } = useParams();
	const accountId = Number(id);
	const [typeFilter, setTypeFilter] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<Date | null>(null);
	const [dateTo, setDateTo] = useState<Date | null>(null);

	const filters = useMemo(() => {
		const result: {
			type?: TransactionType;
			dateFrom?: string;
			dateTo?: string;
		} = {};
		if (typeFilter === 'income' || typeFilter === 'expense') {
			result.type = typeFilter;
		}
		if (dateFrom) {
			result.dateFrom = dateFrom.toISOString();
		}
		if (dateTo) {
			result.dateTo = dateTo.toISOString();
		}
		return result;
	}, [typeFilter, dateFrom, dateTo]);

	return (
		<>
			<Template.Title>Транзакции</Template.Title>
			<Stack gap="md">
				<Stack gap="md" hiddenFrom="sm">
					<Select
						label="Тип"
						placeholder="Все"
						clearable
						data={[
							{ value: 'income', label: 'Доход' },
							{ value: 'expense', label: 'Расход' },
						]}
						value={typeFilter}
						onChange={setTypeFilter}
					/>
					<DatePickerInput
						label="С"
						clearable
						value={dateFrom}
						onChange={(value) => setDateFrom(value as Date | null)}
					/>
					<DatePickerInput
						label="По"
						clearable
						value={dateTo}
						onChange={(value) => setDateTo(value as Date | null)}
					/>
					<Group grow>
						<Button
							component={Link}
							to={transactionNewUrl('income', accountId)}
							color="green"
						>
							Доход
						</Button>
						<Button
							component={Link}
							to={transactionNewUrl('expense', accountId)}
							color="red"
						>
							Расход
						</Button>
						<Button
							component={Link}
							to={transferNewUrl(accountId)}
							variant="light"
						>
							Перевод
						</Button>
					</Group>
				</Stack>
				<Group justify="space-between" wrap="wrap" visibleFrom="sm">
					<Group wrap="wrap">
						<Select
							label="Тип"
							placeholder="Все"
							clearable
							data={[
								{ value: 'income', label: 'Доход' },
								{ value: 'expense', label: 'Расход' },
							]}
							value={typeFilter}
							onChange={setTypeFilter}
							w={160}
						/>
						<DatePickerInput
							label="С"
							clearable
							value={dateFrom}
							onChange={(value) => setDateFrom(value as Date | null)}
							w={160}
						/>
						<DatePickerInput
							label="По"
							clearable
							value={dateTo}
							onChange={(value) => setDateTo(value as Date | null)}
							w={160}
						/>
					</Group>
					<Group mt={24}>
						<Button
							component={Link}
							to={transactionNewUrl('income', accountId)}
							color="green"
						>
							Доход
						</Button>
						<Button
							component={Link}
							to={transactionNewUrl('expense', accountId)}
							color="red"
						>
							Расход
						</Button>
						<Button
							component={Link}
							to={transferNewUrl(accountId)}
							variant="light"
						>
							Перевод
						</Button>
					</Group>
				</Group>
				<TransactionTableWidget accountId={accountId} filters={filters} />
			</Stack>
		</>
	);
}

export function TransactionCreatePage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const type = parseTransactionType(searchParams.get('type'));
	const defaultAccountId = parseAccountIdParam(searchParams.get('accountId'));
	const isIncome = type === 'income';

	return (
		<>
			<Template.Title>{isIncome ? 'Новый доход' : 'Новый расход'}</Template.Title>
			<TransactionForm
				type={type}
				defaultAccountId={defaultAccountId}
				onSuccess={(transaction) =>
					navigate(`/accounts/${transaction.accountId}/transactions`)
				}
			/>
		</>
	);
}

export function LegacyTransactionCreateRedirect() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const type = parseTransactionType(searchParams.get('type'));
	const accountId = parseAccountIdParam(id ?? null);

	return (
		<Navigate
			to={transactionNewUrl(type, accountId)}
			replace
		/>
	);
}

export function TransactionEditPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const transactionId = Number(id);

	return (
		<>
			<Template.Title>Редактирование транзакции</Template.Title>
			<TransactionForm
				id={transactionId}
				onSuccess={(transaction) =>
					navigate(`/accounts/${transaction.accountId}/transactions`)
				}
			/>
		</>
	);
}

export function TransferCreatePage() {
	const { id: routeAccountId } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const defaultFromAccountId =
		parseAccountIdParam(searchParams.get('fromAccountId')) ??
		parseAccountIdParam(routeAccountId ?? null);

	return (
		<>
			<Template.Title>Новый перевод</Template.Title>
			<TransferForm
				defaultFromAccountId={defaultFromAccountId}
				onSuccess={(transfer) =>
					navigate(`/accounts/${transfer.fromAccountId}/transactions`)
				}
			/>
		</>
	);
}

export function LegacyTransferCreateRedirect() {
	const { id } = useParams();
	const accountId = parseAccountIdParam(id ?? null);

	return <Navigate to={transferNewUrl(accountId)} replace />;
}

export function TransferEditPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const transferId = Number(id);

	return (
		<>
			<Template.Title>Редактирование перевода</Template.Title>
			<TransferForm
				id={transferId}
				onSuccess={(transfer) =>
					navigate(`/accounts/${transfer.fromAccountId}/transactions`)
				}
			/>
		</>
	);
}
