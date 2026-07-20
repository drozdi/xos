import type { PropertyDetail } from '@/core/api/endpoints/deviceApi';
import { normalizeEnumRecord } from '@/features/device/propertyEnumUtils';
import type { TypePropertyItem } from '@/features/device/propertyTypes';

export function resolvePrototypeId(source: PropertyDetail): number {
	if (source.prototype_id && source.prototype_id > 0) {
		return source.prototype_id;
	}
	return source.id;
}

export function createTypePropertyFromTemplate(
	source: PropertyDetail,
	sort: number,
): TypePropertyItem {
	const prototypeId = resolvePrototypeId(source);
	return {
		id: 0,
		prototype_id: prototypeId,
		active: source.active ?? true,
		required: source.required ?? false,
		multiple: source.multiple ?? false,
		code: source.code ?? '',
		name: source.name ?? '',
		postfix: source.postfix ?? '',
		fieldType: source.fieldType ?? 'S',
		listType: source.fieldType === 'L' ? source.listType || 'S' : '',
		defaultValue:
			source.defaultValue != null && source.defaultValue !== ''
				? String(source.defaultValue)
				: '',
		sort,
		enums: normalizeEnumRecord(source.enums),
	};
}

export type PropertyCatalogOption = {
	value: number;
	label?: string;
	sublabel?: string;
	group?: string;
};

export function buildPropertyCatalogSelectData(options: PropertyCatalogOption[]) {
	const groups = new Map<string, Array<{ value: string; label: string }>>();
	const standalone: Array<{ value: string; label: string }> = [];

	for (const option of options) {
		const value = String(option.value);
		const label = option.label
			? option.sublabel
				? `${option.label} (${option.sublabel})`
				: option.label
			: value;
		const item = { value, label };
		if (option.group) {
			const groupItems = groups.get(option.group) ?? [];
			groupItems.push(item);
			groups.set(option.group, groupItems);
		} else {
			standalone.push(item);
		}
	}

	const grouped = Array.from(groups, ([group, items]) => ({ group, items }));
	if (standalone.length === 0) {
		return grouped;
	}
	if (grouped.length === 0) {
		return standalone;
	}
	return [{ group: 'Прочие', items: standalone }, ...grouped];
}
