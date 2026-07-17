export type TransactionType = 'income' | 'expense';

export interface ITransactionItem {
	id?: number;
	itemId: number;
	itemName?: string;
	quantity: string;
	price: string;
	sum?: string;
}

export interface ITransaction {
	id: number;
	type: TransactionType;
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
	items: ITransactionItem[];
}

export interface ITransactionFilters {
	accountId: number;
	type?: TransactionType;
	category?: number;
	dateFrom?: string;
	dateTo?: string;
	mcc?: string;
	author?: number;
}

export interface ITransactionCreateItem {
	itemId: number;
	quantity: string;
	price: string;
}

export interface ITransactionPayload {
	type: TransactionType;
	accountId: number;
	date: string;
	categoryId?: number | null;
	comment?: string | null;
	amount?: string;
	isManualAmount?: boolean;
	fn?: string | null;
	fpd?: string | null;
	fp?: string | null;
	fd?: string | null;
	mcc?: string | null;
	items?: ITransactionCreateItem[];
}
