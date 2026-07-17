export interface ApiItemCategory {
	id: number;
	name: string;
	parentId: number | null;
	keywords: string[];
	childrenCount: number;
}
