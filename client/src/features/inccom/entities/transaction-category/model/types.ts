export interface ICategory {

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



export interface IStoreCategory extends IStore<ICategory> {
	loadedAccountIds?: number[];
	selectAccount: (account_id: ICategory['account_id']) => ICategory[];
	findLabelById: (id: ICategory['id']) => ICategory['label'];
}

