export type ApiTransactionType = 'income' | 'expense';

export type ApiTransferCounterpartyDirection = 'to' | 'from';

export interface ApiTransferCounterparty {
	accountId: number;
	accountLabel: string;
	accountType: string | null;
	accountColor: string | null;
	direction: ApiTransferCounterpartyDirection;
	ownerId: number | null;
	ownerName: string | null;
}

export interface ApiTransactionItem {
	id?: number;
	itemId: number;
	itemName?: string;
	quantity: string;
	price: string;
	sum?: string;
}

export interface ApiTransaction {
	id: number;
	type: ApiTransactionType;
	amount: string;
	date: string;
	comment: string | null;
	accountId: number;
	authorId: number | null;
	categoryId: number | null;
	mcc: string | null;
	isManualAmount: boolean;
	fn: string | null;
	fpd: string | null;
	fp: string | null;
	fd: string | null;
	has_receipt?: boolean;
	receipt_json?: Record<string, unknown> | null;
	receipt_checked_at?: string | null;
	transferId: number | null;
	transferCounterparty: ApiTransferCounterparty | null;
	items: ApiTransactionItem[];
}
