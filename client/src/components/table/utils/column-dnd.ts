export const COLUMN_DND_MIME = 'application/x-dmc-table-column-dnd';

export type ColumnDndPayload =
	| { kind: 'field'; field: string; parentKey: string }
	| { kind: 'segment'; segmentKey: string; parentKey: string };

export function serializeColumnDndPayload(payload: ColumnDndPayload): string {
	return JSON.stringify(payload);
}

export function parseColumnDndPayload(raw: string): ColumnDndPayload | null {
	if (!raw) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as ColumnDndPayload;
		if (parsed.kind === 'field' && parsed.field && parsed.parentKey) {
			return parsed;
		}
		if (parsed.kind === 'segment' && parsed.segmentKey && parsed.parentKey) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}
