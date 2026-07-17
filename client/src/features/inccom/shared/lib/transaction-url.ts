import type { TransactionType } from '@inccom/entities/transaction';

export function transactionNewUrl(
	type: TransactionType,
	accountId?: number,
): string {
	const params = new URLSearchParams({ type });
	if (accountId && accountId > 0) {
		params.set('accountId', String(accountId));
	}
	return `/transactions/new?${params.toString()}`;
}

export function transferNewUrl(fromAccountId?: number): string {
	if (fromAccountId && fromAccountId > 0) {
		const params = new URLSearchParams({
			fromAccountId: String(fromAccountId),
		});
		return `/transfers/new?${params.toString()}`;
	}
	return '/transfers/new';
}

export function parseTransactionType(value: string | null): TransactionType {
	return value === 'income' ? 'income' : 'expense';
}

export function parseAccountIdParam(value: string | null): number | undefined {
	if (!value) {
		return undefined;
	}
	const id = Number(value);
	return id > 0 ? id : undefined;
}
