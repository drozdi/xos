export interface PropertyEnumItem extends Record<string, unknown> {
	id: number;
	/** Хранимое значение (поле value в БД) */
	value?: string;
	name?: string;
	sort?: number;
	default?: boolean;
	/** @deprecated используйте value */
	code?: string;
}

export interface PropertyLinkItem extends Record<string, unknown> {
	id: number;
	variant_id?: number | null;
	type_id: number;
	type_kind: 'device' | 'component';
	link_kind: 'property' | 'root';
	type_name?: string;
	type_code?: string;
	property_name?: string;
	property_code?: string;
	parent_property_id?: number | null;
	parent_property_name?: string | null;
	active?: boolean;
	required?: boolean;
	multiple?: boolean;
	readonly?: boolean;
}

export interface TypePropertyItem extends Record<string, unknown> {
	id: number;
	prototype_id?: number | null;
	property_id?: number | null;
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
