import type { ITransactionPayload } from './types';

import type { ITransaction } from './types';

export const defaultTransaction: ITransaction = {
	id: 0,
	type: 'expense',
	amount: '0',
	date: new Date().toISOString(),
	comment: null,
	accountId: 0,
	authorId: null,
	categoryId: null,
	mcc: null,
	isManualAmount: false,
	fn: null,
	fpd: null,
	fp: null,
	fd: null,
	transferId: null,
	transferCounterparty: null,
	items: [],
};

export const defaultTransactionPayload: ITransactionPayload = {
	type: 'expense',
	accountId: 0,
	date: new Date().toISOString(),
	categoryId: null,
	comment: null,
	isManualAmount: false,
	items: [],
};
