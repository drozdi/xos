export interface IItemCategory {

	id: number;

	name: string;

	parentId: number | null;

	keywords: string[];

	childrenCount: number;

}



export interface IItemCategoryFilters {

	search?: string;

	parent?: number | 'null' | null;

}

