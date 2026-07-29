import { useEnumsTypeAccount } from '@inccom/entities/account';
import {
	useTransactionsQuery,
	type ITransaction,
	type ITransactionFilters,
} from '@inccom/entities/transaction';
import { useTransactionCategoriesQuery } from '@inccom/entities/transaction-category';
import { useStoreUserProfile } from '@inccom/entities/user';
import { AccountColorDot } from '@inccom/shared/lib/format-account-select-label';
import {
	formatTransferActionLabel,
	formatTransferCounterpartyLine,
} from '@inccom/shared/lib/format-transfer-counterparty';
import { DataColumn, TableData } from '@inccom/shared/ui/table';
import { formatBalance } from '@inccom/shared/utils/number-format';
import { Anchor, Group, ScrollArea, Text } from '@mantine/core';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

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
	const accountTypes = useEnumsTypeAccount();
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

	return (
		<ScrollArea type="auto" offsetScrollbars>
			<TableData<ITransaction>
				data={transactions}
				loading={isLoading}
				withPagination={false}
				withTableBorder
				storage={`transactions.list.${accountId}`}
				noDataText="Транзакций нет"
				miw={600}
				w="100%"
			>
				<DataColumn<ITransaction>
					field="date"
					header="Дата"
					sortable
					resizable
					body={(transaction) => formatDate(transaction.date)}
				/>
				<DataColumn<ITransaction>
					field="type"
					header="Тип"
					sortable
					resizable
					body={(transaction) => {
						if (!transaction.transferId) {
							return TYPE_LABELS[transaction.type] ?? transaction.type;
						}

						const actionLabel = formatTransferActionLabel(transaction.type);
						const counterpartyLine = formatTransferCounterpartyLine(
							transaction.transferCounterparty,
							userData?.id,
							accountTypes.findLabelByCode,
						);

						return (
							<>
								{isTransferDebit(transaction) ? (
									<Text c="red" size="sm">
										{actionLabel}
									</Text>
								) : (
									<Text size="sm">{actionLabel}</Text>
								)}
								{counterpartyLine && (
									<Group gap={6} wrap="nowrap">
										<AccountColorDot
											color={
												transaction.transferCounterparty?.accountColor
											}
											size={8}
										/>
										<Text size="xs" c="dimmed">
											{counterpartyLine}
										</Text>
									</Group>
								)}
							</>
						);
					}}
				/>
				<DataColumn<ITransaction>
					field="amount"
					header="Сумма"
					sortable
					align="right"
					resizable
					body={(transaction) => (
						<Anchor
							component={Link}
							to={getTransactionEditPath(transaction)}
							c={isTransferDebit(transaction) ? 'red' : undefined}
							fw={isTransferDebit(transaction) ? 600 : undefined}
						>
							{formatTransactionAmount(transaction)}
						</Anchor>
					)}
				/>
				<DataColumn<ITransaction>
					field="comment"
					header="Комментарий"
					sortable
					resizable
					ellipsis
					body={(transaction) => transaction.comment ?? '—'}
				/>
				<DataColumn<ITransaction>
					field="categoryId"
					header="Категория"
					sortable
					resizable
					body={(transaction) =>
						transaction.categoryId
							? (categoryMap.get(transaction.categoryId) ??
								transaction.categoryId)
							: '—'
					}
				/>
			</TableData>
		</ScrollArea>
	);
}
