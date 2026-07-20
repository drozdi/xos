export interface PropertyEnumItem extends Record<string, unknown> {
	id: number;
	value?: string;
	name?: string;
	sort?: number;
	default?: boolean;
	code?: string;
}

export interface TypePropertyItem extends Record<string, unknown> {
	id: number;
	prototype_id?: number | null;
	active?: boolean;
	required?: boolean;
	multiple?: boolean;
	code?: string;
	name?: string;
	postfix?: string;
	fieldType?: string;
	listType?: string;
	defaultValue?: string | number | null;
	sort?: number;
	enums?: Record<string, PropertyEnumItem>;
}
