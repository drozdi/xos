export interface ApiTransactionCategory {
	id: number;
	name: string;
	type?: string;
	order?: number;
	accountId?: number;
	createdById?: number;
	createdAt?: string;
	updatedAt?: string;
}
