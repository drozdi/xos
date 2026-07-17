export interface ApiItem {
	id: number;
	name: string;
	description: string | null;
	unit: string | null;
	categoryIds: number[];
}
