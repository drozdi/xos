interface IRequestList {

	limit: number;

	offset: number;

}



type IResponse<T> = T;



interface IResponseList<T> {

	items: T[];

	countItems: number;

	totalItems: number;

	limit: number;

	offset: number;

	next: number;

	prev: number;

	total: number;

}



interface IStore<T extends object> {

	isLoading: boolean;

	error: any;

	load: (reload?: boolean) => Promise<void>;

	list: T[];

	findById: (id: T['id']) => T | undefined;

	add: (data: Partial<T>) => Promise<T | undefined>;

	detail: (id: T['id']) => Promise<T | undefined>;

	update: (id: T['id'], data: Partial<T>) => Promise<T | undefined>;

	delete: (id: T['id']) => Promise<T | undefined>;

}



interface IAccountParticipant {

	id: number;

	login: string;

}



interface IAccount {

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



interface IStoreAccount extends IStore<IAccount> {}



interface ITransfer {

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



interface ICategory {

	id: number;

	x_timestamp: string;

	owner: string;

	owner_id: number;

	account_id: number;

	sort: number;

	label: string;

	type: string;

	mcc: number;

}



interface IStoreCategory extends IStore<ICategory> {
	loadedAccountIds?: number[];
	selectAccount: (account_id: ICategory['account_id']) => ICategory[];
	findLabelById: (id: ICategory['id']) => ICategory['label'];
}



interface IItem {

	id: number;

	name: string;

	description: string | null;

	unit: string | null;

	categoryIds: number[];

}



interface IItemCategory {

	id: number;

	name: string;

	parentId: number | null;

	keywords: string[];

	childrenCount: number;

}



interface IUser {

	id: number;

	login?: string;

	email: string;

	name?: string;

	alias: string;

	second_name: string;

	first_name: string;

	patronymic: string;

	description: string;

	date_register: string;

	last_login: string;

	x_timestamp: string;

	phone?: string;

	father_name?: string;

	password?: string;

}



interface IError {

	response?: {

		data?: { error?: string };

		detail?: string;

	};

	message?: string;

}

