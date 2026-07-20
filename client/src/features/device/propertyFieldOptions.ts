export const FIELD_TYPE_OPTIONS = [
	{ value: 'S', label: 'Строка' },
	{ value: 'L', label: 'Список' },
	{ value: 'N', label: 'Число' },
] as const;

export const LIST_TYPE_OPTIONS = [
	{ value: 'S', label: 'Выпадающий список' },
	{ value: 'C', label: 'Переключатель' },
] as const;

export type FieldTypeCode = (typeof FIELD_TYPE_OPTIONS)[number]['value'];
export type ListTypeCode = (typeof LIST_TYPE_OPTIONS)[number]['value'];
