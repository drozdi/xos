export interface IItem {

	id: number;

	name: string;

	description: string | null;

	unit: string | null;

	categoryIds: number[];

}



export interface IItemFilters {

	search?: string;

	category?: number;

}

