export interface IAccountParticipant {

	id: number;

	name: string;

	email: string | null;

	login?: string | null;

}



export interface IAccount {

	id: number;

	x_timestamp: string;

	owner: string;

	owner_id: number;

	sort: number;

	label: string;

	description?: string | null;

	number?: string | null;

	balance: number;

	type: string;

	color: string;

	icon: string;

	currency: string;

	isMaster?: boolean;

	participants?: IAccountParticipant[];

}

/** Bank-like account types (cards / deposits), excluding cash/other. */
export const BANK_ACCOUNT_TYPES = ['debit', 'credit', 'deposit', 'saving'] as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export function isBankAccountType(type: string): boolean {
	return (BANK_ACCOUNT_TYPES as readonly string[]).includes(type);
}



export interface IStoreAccount extends IStore<IAccount> {}

