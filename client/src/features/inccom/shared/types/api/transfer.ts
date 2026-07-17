export interface ApiTransfer {
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
