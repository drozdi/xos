export type ApiTransactionType = 'income' | 'expense';

export type ApiTransferCounterpartyDirection = 'to' | 'from';

export interface ApiTransferCounterparty {
	accountId: number;
	accountLabel: string;
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
	transferId: number | null;
	transferCounterparty: ApiTransferCounterparty | null;
	items: ApiTransactionItem[];
}
