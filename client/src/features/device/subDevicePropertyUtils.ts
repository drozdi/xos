import type { PropertyEnumItem } from '@/features/device/propertyTypes';

export interface SubDevicePropertyValue extends Record<string, unknown> {
	id: number | string;
	property_id: number;
	name?: string;
	fieldType?: string;
	listType?: string;
	multiple?: boolean;
	value?: string;
	valueS?: string;
	valueN?: number | string | null;
	valueL?: number | number[] | null;
	enums?: Record<string, PropertyEnumItem>;
	sort?: number;
	postfix?: string;
	required?: boolean;
}

export function sortSubDeviceProperties(
	properties: Record<string, SubDevicePropertyValue>,
): Array<[string, SubDevicePropertyValue]> {
	return Object.entries(properties).sort(
		([, a], [, b]) => (Number(a.sort) || 0) - (Number(b.sort) || 0),
	);
}

function enumLabel(item: PropertyEnumItem): string {
	return item.name ?? item.value ?? String(item.id);
}

function buildListDisplayValue(
	item: SubDevicePropertyValue,
	valueL: number | number[] | null | undefined,
): { value: string; valueS: string; valueL: number | number[] | null } {
	const enums = item.enums ?? {};
	const ids = Array.isArray(valueL) ? valueL : valueL != null ? [valueL] : [];
	const names = ids
		.map((id) => enums[String(id)] ?? enums[id])
		.filter(Boolean)
		.map((entry) => enumLabel(entry as PropertyEnumItem));
	const value = names.join(', ');
	const normalizedValueL = item.multiple ? ids : (ids[0] ?? null);
	return { value, valueS: value, valueL: normalizedValueL };
}

export function patchSubDeviceProperty(
	item: SubDevicePropertyValue,
	patch: Partial<SubDevicePropertyValue>,
): SubDevicePropertyValue {
	const next = { ...item, ...patch };
	if (next.fieldType === 'L' && 'valueL' in patch) {
		const listValues = buildListDisplayValue(next, next.valueL);
		return { ...next, ...listValues };
	}
	if (next.fieldType === 'S' && 'value' in patch) {
		return { ...next, valueS: String(patch.value ?? '') };
	}
	if (next.fieldType === 'N' && 'valueN' in patch) {
		return { ...next, value: String(patch.valueN ?? '') };
	}
	return next;
}

export function normalizeSubDevicePropertiesRecord(
	value: unknown,
): Record<string, SubDevicePropertyValue> {
	if (!value || typeof value !== 'object') {
		return {};
	}
	const record: Record<string, SubDevicePropertyValue> = {};
	for (const [key, item] of Object.entries(value as Record<string, SubDevicePropertyValue>)) {
		if (!item || typeof item !== 'object') {
			continue;
		}
		record[key] = item;
	}
	return record;
}
