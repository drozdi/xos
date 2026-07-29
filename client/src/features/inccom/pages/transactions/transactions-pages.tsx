import { useAccountsQuery, useEnumsTypeAccount } from '@inccom/entities/account';
import type { TransactionType } from '@inccom/entities/transaction';
import { TransactionForm } from '@inccom/features/transaction-form';
import { TransferForm } from '@inccom/features/transfer-form';
import { Template } from '@inccom/layouts';
import {
	AccountColorDot,
	buildAccountSelectOptions,
	getAccountOptionColor,
	renderAccountSelectOption,
} from '@inccom/shared/lib/format-account-select-label';
import {
	parseAccountIdParam,
	parseTransactionType,
	transactionNewUrl,
	transferNewUrl,
} from '@inccom/shared/lib/transaction-url';
import { TransactionTableWidget } from '@inccom/widgets';
import { Group, Select, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

export function TransactionsListPage() {
	const { id } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const routeAccountId = parseAccountIdParam(id ?? null);
	const showAccountSelect = routeAccountId === undefined;

	const { data: accountsData, isLoading: isAccountsLoading } = useAccountsQuery();
	const accountTypes = useEnumsTypeAccount();
	const accounts = accountsData?.items ?? [];

	const accountOptions = useMemo(
		() => buildAccountSelectOptions(accounts, accountTypes.findLabelByCode),
		[accounts, accountTypes.findLabelByCode],
	);

	const queryAccountId = parseAccountIdParam(searchParams.get('accountId'));
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
		queryAccountId ? String(queryAccountId) : null,
	);

	useEffect(() => {
		if (!showAccountSelect || accounts.length === 0) {
			return;
		}
		if (selectedAccountId && accounts.some((a) => String(a.id) === selectedAccountId)) {
			return;
		}
		const fallbackId = accounts[0]?.id;
		const fallback =
			queryAccountId != null
				? String(queryAccountId)
				: fallbackId != null
					? String(fallbackId)
					: null;
		if (fallback) {
			setSelectedAccountId(fallback);
		}
	}, [showAccountSelect, accounts, selectedAccountId, queryAccountId]);

	useEffect(() => {
		if (!showAccountSelect || !selectedAccountId) {
			return;
		}
		const current = searchParams.get('accountId');
		if (current === selectedAccountId) {
			return;
		}
		const next = new URLSearchParams(searchParams);
		next.set('accountId', selectedAccountId);
		setSearchParams(next, { replace: true });
	}, [showAccountSelect, selectedAccountId, searchParams, setSearchParams]);

	const accountId = routeAccountId ?? (selectedAccountId ? Number(selectedAccountId) : 0);

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

	const accountSelect = showAccountSelect ? (
		<Select
			label="Счёт"
			data={accountOptions}
			value={selectedAccountId}
			onChange={setSelectedAccountId}
			searchable
			disabled={isAccountsLoading || accountOptions.length === 0}
			renderOption={renderAccountSelectOption}
			leftSection={
				<AccountColorDot
					color={getAccountOptionColor(accountOptions, selectedAccountId)}
				/>
			}
			leftSectionPointerEvents="none"
			placeholder={isAccountsLoading ? 'Загрузка…' : 'Выберите счёт'}
			w={{ base: '100%', sm: 320 }}
		/>
	) : null;

	return (
		<>
			<Template.Title>История транзакций</Template.Title>
			<Stack gap="md">
				<Stack gap="md" hiddenFrom="sm">
					{accountSelect}
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
				</Stack>
				<Group wrap="wrap" align="flex-end" visibleFrom="sm">
					{accountSelect}
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
				{accountId > 0 ? (
					<TransactionTableWidget accountId={accountId} filters={filters} />
				) : (
					<Text c="dimmed">Выберите счёт для просмотра истории</Text>
				)}
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

	return <Navigate to={transactionNewUrl(type, accountId)} replace />;
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
