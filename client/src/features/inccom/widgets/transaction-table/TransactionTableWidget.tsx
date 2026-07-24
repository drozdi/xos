import { Typography } from 'antd';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useTransactionCategoriesQuery } from '@inccom/entities/transaction-category';
import {
	useTransactionsQuery,
	type ITransaction,
	type ITransactionFilters,
} from '@inccom/entities/transaction';
import { useStoreUserProfile } from '@inccom/entities/user';
import { formatTransferCounterparty } from '@inccom/shared/lib/format-transfer-counterparty';
import { formatBalance } from '@inccom/shared/utils/number-format';
import { DataTable, type DataTableColumn } from '@/ui/data-table';

interface TransactionTableWidgetProps {
	accountId: number;
	filters?: Omit<ITransactionFilters, 'accountId'>;
}

const TYPE_LABELS: Record<string, string> = {
	income: 'Доход',
	expense: 'Расход',
};

function getTransactionEditPath(transaction: ITransaction): string {
	if (transaction.transferId) {
		return `/transfers/${transaction.transferId}/edit`;
	}
	return `/transactions/${transaction.id}/edit`;
}

function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleString('ru-RU');
}

function isTransferDebit(transaction: ITransaction): boolean {
	return transaction.transferId !== null && transaction.type === 'expense';
}

function formatTransactionType(transaction: ITransaction): string {
	if (transaction.transferId) {
		return transaction.type === 'expense'
			? 'Перевод (списание)'
			: 'Перевод (зачисление)';
	}
	return TYPE_LABELS[transaction.type] ?? transaction.type;
}

function formatTransactionAmount(transaction: ITransaction): string {
	const formatted = formatBalance(transaction.amount);
	if (isTransferDebit(transaction)) {
		return `−${formatted}`;
	}
	return formatted;
}

export function TransactionTableWidget({
	accountId,
	filters = {},
}: TransactionTableWidgetProps) {
	const queryParams = useMemo(
		() => ({
			accountId,
			limit: 100,
			offset: 0,
			...filters,
		}),
		[accountId, filters],
	);

	const { data, isLoading } = useTransactionsQuery(queryParams);
	const { userData } = useStoreUserProfile();
	const { data: categoriesData } = useTransactionCategoriesQuery({
		accountId,
		limit: 100,
		offset: 0,
	});

	const categoryMap = useMemo(() => {
		const map = new Map<number, string>();
		for (const category of categoriesData?.items ?? []) {
			map.set(category.id, category.label);
		}
		return map;
	}, [categoriesData?.items]);

	const transactions = data?.items ?? [];

	const columns = useMemo<DataTableColumn<ITransaction>[]>(
		() => [
			{
				field: 'date',
				header: 'Дата',
				sortable: true,
				resizable: true,
				render: (transaction) => formatDate(transaction.date),
			},
			{
				field: 'type',
				header: 'Тип',
				sortable: true,
				resizable: true,
				render: (transaction) => {
					const transferLabel = formatTransferCounterparty(
						transaction.transferCounterparty,
						userData?.id,
					);
					return (
						<>
							{isTransferDebit(transaction) ? (
								<Typography.Text type="danger">
									{formatTransactionType(transaction)}
								</Typography.Text>
							) : (
								formatTransactionType(transaction)
							)}
							{transferLabel ? (
								<div>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{transferLabel}
									</Typography.Text>
								</div>
							) : null}
						</>
					);
				},
			},
			{
				field: 'amount',
				header: 'Сумма',
				sortable: true,
				align: 'right',
				resizable: true,
				render: (transaction) => (
					<Link
						to={getTransactionEditPath(transaction)}
						style={{
							color: isTransferDebit(transaction) ? '#ff4d4f' : undefined,
							fontWeight: isTransferDebit(transaction) ? 600 : undefined,
						}}
					>
						{formatTransactionAmount(transaction)}
					</Link>
				),
			},
			{
				field: 'comment',
				header: 'Комментарий',
				sortable: true,
				resizable: true,
				render: (transaction) => transaction.comment ?? '—',
			},
			{
				field: 'categoryId',
				header: 'Категория',
				sortable: true,
				resizable: true,
				render: (transaction) =>
					transaction.categoryId
						? (categoryMap.get(transaction.categoryId) ?? transaction.categoryId)
						: '—',
			},
		],
		[categoryMap, userData?.id],
	);

	return (
		<div style={{ overflow: 'auto', width: '100%' }}>
			<DataTable<ITransaction>
				columns={columns}
				data={transactions}
				loading={isLoading}
				storageKey={`transactions.list.${accountId}`}
				withPagination={false}
				noDataText="Транзакций нет"
				minHeight={320}
			/>
		</div>
	);
}
