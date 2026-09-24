import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';

import { CONTENT_PROPS } from './contentCatalog';

type PropertyValue = IblockElementDetail['PROPERTY_VALUES'][string];

export function fileIdFromProperty(value: PropertyValue | undefined): number | null {
	const ids = fileIdsFromProperty(value);
	return ids[0] ?? null;
}

export function fileIdsFromProperty(value: PropertyValue | undefined): number[] {
	if (value == null || value === '') return [];
	const items = Array.isArray(value) ? value : [value];
	const ids: number[] = [];
	for (const item of items) {
		if (item == null || item === '') continue;
		if (typeof item === 'object' && item !== null && 'id' in item) {
			const n = Number(item.id);
			if (Number.isFinite(n) && n > 0) ids.push(n);
			continue;
		}
		const n = Number(item);
		if (Number.isFinite(n) && n > 0) ids.push(n);
	}
	return ids;
}

export function fileItemsFromProperty(
	value: PropertyValue | undefined,
): Array<{ id: number; name: string; src: string }> {
	if (value == null || value === '') return [];
	const items = Array.isArray(value) ? value : [value];
	const out: Array<{ id: number; name: string; src: string }> = [];
	for (const item of items) {
		if (item == null || typeof item !== 'object' || !('id' in item)) continue;
		const id = Number(item.id);
		if (!Number.isFinite(id) || id <= 0) continue;
		out.push({
			id,
			name: typeof item.name === 'string' ? item.name : String(id),
			src: typeof item.src === 'string' ? item.src : '',
		});
	}
	return out;
}

export function fileSrcListFromProperty(value: PropertyValue | undefined): string[] {
	return fileItemsFromProperty(value)
		.map((item) => item.src)
		.filter(Boolean);
}

/** HTML accept for property file_type (empty = any). */
export function fileAcceptFromFileType(fileType: string | null | undefined): string | undefined {
	const raw = (fileType ?? '').trim();
	if (!raw) return undefined;
	const lower = raw.toLowerCase();
	if (lower === 'image') return 'image/*';
	if (raw.includes('/')) return raw;
	const parts = raw
		.split(/[\s,;]+/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((ext) => (ext.startsWith('.') ? ext : `.${ext.replace(/^\./, '')}`));
	return parts.length > 0 ? parts.join(',') : undefined;
}

export function fileLabelFromProperty(value: PropertyValue | undefined): string {
	if (value == null || value === '') return '';
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) return null;
				if (typeof item === 'object' && item !== null && 'name' in item) {
					return item.name || String(item.id);
				}
				return String(item);
			})
			.filter(Boolean)
			.join(', ');
	}
	if (typeof value === 'object' && value !== null && 'name' in value) {
		return value.name || String(value.id);
	}
	return String(value);
}

export function fileSrcFromProperty(value: PropertyValue | undefined): string | null {
	if (value == null || value === '') return null;
	const item = Array.isArray(value) ? value[0] : value;
	if (item && typeof item === 'object' && 'src' in item && typeof item.src === 'string') {
		return item.src;
	}
	return null;
}

export function stringListFromProperty(value: PropertyValue | undefined): string[] {
	if (value == null || value === '') return [];
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) return null;
				if (typeof item === 'object') return null;
				// Keep empty strings so UI can append blank ingredient rows.
				return String(item);
			})
			.filter((item): item is string => item != null);
	}
	if (typeof value === 'object') return [];
	return [String(value)];
}

export function scalarFromProperty(value: PropertyValue | undefined): string {
	if (value == null || value === '') return '';
	if (Array.isArray(value)) {
		const first = value[0];
		if (first == null) return '';
		if (typeof first === 'object' && first !== null && 'code' in first && first.code) {
			return String(first.code);
		}
		if (typeof first === 'object' && first !== null && 'id' in first) {
			return String(first.id);
		}
		return String(first);
	}
	if (typeof value === 'object' && value !== null) {
		if ('code' in value && value.code) return String(value.code);
		if ('id' in value) return String(value.id);
		return '';
	}
	return String(value);
}

export function numberFromProperty(value: PropertyValue | undefined): number | null {
	const raw = scalarFromProperty(value);
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

export function getCoverValue(values: IblockElementDetail['PROPERTY_VALUES'] | undefined) {
	return values?.[CONTENT_PROPS.COVER];
}

export function patchPropertyValues(
	values: IblockElementDetail['PROPERTY_VALUES'] | undefined,
	code: string,
	next: PropertyValue,
): IblockElementDetail['PROPERTY_VALUES'] {
	return { ...(values ?? {}), [code]: next };
}
