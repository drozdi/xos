export interface ITransfer {

	id: number;

	amount: string;

	date: string;

	comment: string | null;

	fromAccountId: number;

	toAccountId: number;

	authorId: number | null;

	outgoingTransactionId: number | null;

	incomingTransactionId: number | null;

}



export interface ITransferFilters {

	fromAccount?: number;

	toAccount?: number;

	dateFrom?: string;

	dateTo?: string;

}



export interface ITransferPayload {

	fromAccountId: number;

	toAccountId: number;

	amount: string;

	date: string;

	comment?: string | null;

}

