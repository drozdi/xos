import { nextTempId } from '@/features/device/deviceAppUtils';

import type { PropertyEnumItem } from './propertyTypes';

export function sortEnumEntries(enums: Record<string, PropertyEnumItem>): Array<[string, PropertyEnumItem]> {
	return Object.entries(enums ?? {}).sort(([, a], [, b]) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function normalizeEnumRecord(value: unknown): Record<string, PropertyEnumItem> {
	if (!value || typeof value !== 'object') {
		return {};
	}
	const record: Record<string, PropertyEnumItem> = {};
	for (const [key, item] of Object.entries(value as Record<string, PropertyEnumItem>)) {
		if (typeof item !== 'object' || item == null) {
			continue;
		}
		const enumItem = item as PropertyEnumItem;
		record[key] = {
			...enumItem,
			value: enumItem.value ?? enumItem.code ?? '',
		};
	}
	return record;
}

export function createEnumItem(sort: number): PropertyEnumItem {
	return {
		id: 0,
		value: '',
		name: '',
		sort,
		default: false,
	};
}

export function addEnumItem(enums: Record<string, PropertyEnumItem>): Record<string, PropertyEnumItem> {
	const entries = sortEnumEntries(enums);
	const nextSort = (entries.at(-1)?.[1].sort ?? 0) + 10;
	const key = nextTempId('e');
	return { ...enums, [key]: createEnumItem(nextSort) };
}

export function reorderEnumEntries(
	entries: Array<[string, PropertyEnumItem]>,
	fromIndex: number,
	toIndex: number,
): Record<string, PropertyEnumItem> {
	if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
		return Object.fromEntries(entries);
	}
	const next = [...entries];
	const [moved] = next.splice(fromIndex, 1);
	if (!moved) {
		return Object.fromEntries(entries);
	}
	next.splice(toIndex, 0, moved);
	const record: Record<string, PropertyEnumItem> = {};
	next.forEach(([key, item], index) => {
		record[key] = { ...item, sort: (index + 1) * 10 };
	});
	return record;
}

export function setEnumDefault(
	enums: Record<string, PropertyEnumItem>,
	key: string,
	isDefault: boolean,
): Record<string, PropertyEnumItem> {
	const next: Record<string, PropertyEnumItem> = {};
	for (const [enumKey, item] of Object.entries(enums)) {
		next[enumKey] = {
			...item,
			default: enumKey === key ? isDefault : false,
		};
	}
	return next;
}

export function resolveDefaultEnumValue(enums: Record<string, PropertyEnumItem>): string {
	const entry = sortEnumEntries(enums).find(([, item]) => item.default);
	return entry?.[1].value ?? '';
}
