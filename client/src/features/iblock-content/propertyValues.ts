import type { IblockElementDetail } from '@/core/api/endpoints/iblockApi';

import { CONTENT_PROPS } from './contentCatalog';

type PropertyValue = IblockElementDetail['PROPERTY_VALUES'][string];

export function fileIdFromProperty(value: PropertyValue | undefined): number | null {
	const ids = fileIdsFromProperty(value);
	return ids[0] ?? null;
}

export function fileIdsFromProperty(value: PropertyValue | undefined): number[] {
	if (value == null || value === '') {return [];}
	const items = Array.isArray(value) ? value : [value];
	const ids: number[] = [];
	for (const item of items) {
		if (item == null || item === '') {continue;}
		if (typeof item === 'object' && item !== null && 'id' in item) {
			const n = Number(item.id);
			if (Number.isFinite(n) && n > 0) {ids.push(n);}
			continue;
		}
		const n = Number(item);
		if (Number.isFinite(n) && n > 0) {ids.push(n);}
	}
	return ids;
}

export function fileItemsFromProperty(
	value: PropertyValue | undefined,
): Array<{ id: number; name: string; src: string }> {
	if (value == null || value === '') {return [];}
	const items = Array.isArray(value) ? value : [value];
	const out: Array<{ id: number; name: string; src: string }> = [];
	for (const item of items) {
		if (item == null || typeof item !== 'object' || !('id' in item)) {continue;}
		const id = Number(item.id);
		if (!Number.isFinite(id) || id <= 0) {continue;}
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
	if (!raw) {return undefined;}
	const lower = raw.toLowerCase();
	if (lower === 'image') {return 'image/*';}
	if (raw.includes('/')) {return raw;}
	const parts = raw
		.split(/[\s,;]+/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((ext) => (ext.startsWith('.') ? ext : `.${ext.replace(/^\./, '')}`));
	return parts.length > 0 ? parts.join(',') : undefined;
}

export function fileLabelFromProperty(value: PropertyValue | undefined): string {
	if (value == null || value === '') {return '';}
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) {return null;}
				if (typeof item === 'object' && item !== null && 'name' in item) {
					return item.name || String(item.id);
				}
				return String(item);
			})
			.filter((item): item is string => typeof item === 'string' && item !== '')
			.join(', ');
	}
	if (typeof value === 'object' && value !== null && !Array.isArray(value) && 'name' in value) {
		const name = value.name;
		const id = 'id' in value ? value.id : '';
		return (typeof name === 'string' && name) || String(id ?? '');
	}
	return String(value);
}

export function fileSrcFromProperty(value: PropertyValue | undefined): string | null {
	if (value == null || value === '') {return null;}
	const item = Array.isArray(value) ? value[0] : value;
	if (item && typeof item === 'object' && 'src' in item && typeof item.src === 'string') {
		return item.src;
	}
	return null;
}

export interface IngredientRow {
	[key: string]: string | number | null;
	NAME: string;
	QTY: number | null;
	UNIT: string;
}

export function emptyIngredientRow(): IngredientRow {
	return { NAME: '', QTY: null, UNIT: '' };
}

export function storedIngredientRow(row: IngredientRow): Record<string, string | number | null> {
	return { NAME: row.NAME, QTY: row.QTY, UNIT: row.UNIT };
}

export function ingredientRowsFromProperty(value: PropertyValue | undefined): IngredientRow[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.flatMap((item) => {
		if (typeof item === 'string') {
			return [ingredientFromLegacyLine(item)];
		}
		if (!item || typeof item !== 'object' || Array.isArray(item) || 'src' in item) {
			return [];
		}
		const record = item as Record<string, unknown>;
		if (!('NAME' in record) && !('QTY' in record) && !('UNIT' in record)) {
			return [];
		}
		const qty = record.QTY;
		const parsedQty =
			typeof qty === 'number'
				? qty
				: typeof qty === 'string' && qty.trim() !== ''
					? Number(qty.replace(',', '.'))
					: null;
		return [
			{
				NAME: typeof record.NAME === 'string' ? record.NAME : '',
				QTY: parsedQty != null && !Number.isNaN(parsedQty) ? parsedQty : null,
				UNIT: typeof record.UNIT === 'string' ? record.UNIT : '',
			},
		];
	});
}

export function formatIngredientRow(row: IngredientRow): string {
	const amount = [row.QTY != null ? String(row.QTY) : '', row.UNIT.trim()].filter(Boolean).join(' ');
	if (row.NAME.trim() && amount) {
		return `${row.NAME.trim()} — ${amount}`;
	}
	return row.NAME.trim() || amount;
}

function ingredientFromLegacyLine(line: string): IngredientRow {
	const parts = line.split(/\s+[—–-]\s+/);
	if (parts.length < 2) {
		return { NAME: line, QTY: null, UNIT: '' };
	}
	const name = parts[0]?.trim() ?? '';
	const rest = parts.slice(1).join(' — ').trim();
	const match = /^(\d+(?:[.,]\d+)?)\s*(.*)$/.exec(rest);
	if (!match) {
		return { NAME: name, QTY: null, UNIT: rest };
	}
	return {
		NAME: name,
		QTY: Number(match[1]?.replace(',', '.')),
		UNIT: match[2]?.trim() ?? '',
	};
}

export function stringListFromProperty(value: PropertyValue | undefined): string[] {
	if (value == null || value === '') {return [];}
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (item == null) {return null;}
				if (typeof item === 'object') {return null;}
				// Keep empty strings so UI can append blank ingredient rows.
				return String(item);
			})
			.filter((item): item is string => item != null);
	}
	if (typeof value === 'object') {return [];}
	return [String(value)];
}

export function scalarFromProperty(value: PropertyValue | undefined): string {
	if (value == null || value === '') {return '';}
	if (Array.isArray(value)) {
		const first = value[0];
		if (first == null) {return '';}
		if (typeof first === 'object' && first !== null && 'code' in first && first.code) {
			return String(first.code);
		}
		if (typeof first === 'object' && first !== null && 'id' in first) {
			return String(first.id);
		}
		return String(first);
	}
	if (typeof value === 'object' && value !== null) {
		if ('code' in value && value.code) {return String(value.code);}
		if ('id' in value) {return String(value.id);}
		return '';
	}
	return String(value);
}

export function numberFromProperty(value: PropertyValue | undefined): number | null {
	const raw = scalarFromProperty(value);
	if (!raw) {return null;}
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
