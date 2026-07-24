import { Button, DatePicker, Flex, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { TransactionType } from '@inccom/entities/transaction';
import { TransactionForm } from '@inccom/features/transaction-form';
import { TransferForm } from '@inccom/features/transfer-form';
import { Template } from '@inccom/layouts';
import {
	parseAccountIdParam,
	parseTransactionType,
	transactionNewUrl,
	transferNewUrl,
} from '@inccom/shared/lib/transaction-url';
import { TransactionTableWidget } from '@inccom/widgets';

export function TransactionsListPage() {
	const { id } = useParams();
	const accountId = Number(id);
	const [typeFilter, setTypeFilter] = useState<string | null>(null);
	const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
	const [dateTo, setDateTo] = useState<Dayjs | null>(null);

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

	const typeSelect = (
		<div>
			<div style={{ marginBottom: 4 }}>Тип</div>
			<Select
				allowClear
				placeholder="Все"
				style={{ width: 160 }}
				value={typeFilter}
				onChange={(value) => setTypeFilter(value ?? null)}
				options={[
					{ value: 'income', label: 'Доход' },
					{ value: 'expense', label: 'Расход' },
				]}
			/>
		</div>
	);

	const dateFilters = (
		<>
			<div>
				<div style={{ marginBottom: 4 }}>С</div>
				<DatePicker
					allowClear
					value={dateFrom}
					onChange={(value) => setDateFrom(value)}
					style={{ width: 160 }}
				/>
			</div>
			<div>
				<div style={{ marginBottom: 4 }}>По</div>
				<DatePicker
					allowClear
					value={dateTo}
					onChange={(value) => setDateTo(value)}
					style={{ width: 160 }}
				/>
			</div>
		</>
	);

	const actionButtons = (
		<Flex gap={8} wrap="wrap">
			<Link to={transactionNewUrl('income', accountId)}>
				<Button type="primary">Доход</Button>
			</Link>
			<Link to={transactionNewUrl('expense', accountId)}>
				<Button danger type="primary">
					Расход
				</Button>
			</Link>
			<Link to={transferNewUrl(accountId)}>
				<Button>Перевод</Button>
			</Link>
		</Flex>
	);

	return (
		<>
			<Template.Title>Транзакции</Template.Title>
			<Flex vertical gap={16}>
				<Flex gap={12} wrap="wrap" align="flex-end" justify="space-between">
					<Flex gap={12} wrap="wrap" align="flex-end">
						{typeSelect}
						{dateFilters}
					</Flex>
					{actionButtons}
				</Flex>
				<TransactionTableWidget accountId={accountId} filters={filters} />
			</Flex>
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
