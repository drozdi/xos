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

	balance: number;

	type: string;

	color: string;

	icon: string;

	currency: string;

	isMaster?: boolean;

	participants?: IAccountParticipant[];

}



export interface IStoreAccount extends IStore<IAccount> {}

