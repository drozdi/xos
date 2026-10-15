import { userDataApi } from '@/core/api/endpoints/userData';

export const STICKY_COLORS = [
	'#fff59d',
	'#ffcc80',
	'#ef9a9a',
	'#ce93d8',
	'#90caf9',
	'#a5d6a7',
] as const;

export type StickyColor = (typeof STICKY_COLORS)[number];

export type StickyNoteData = {
	text: string;
	color: StickyColor;
};

const storageKey = (instanceKey: string) => `xos.sticky-note.${instanceKey}`;
const remoteCode = (instanceKey: string) => `sticky.${instanceKey}`;

function parseSticky(raw: unknown): StickyNoteData {
	if (!raw || typeof raw !== 'object') {
		return { text: '', color: STICKY_COLORS[0] };
	}
	const parsed = raw as Partial<StickyNoteData>;
	const color = STICKY_COLORS.includes(parsed.color as StickyColor)
		? (parsed.color as StickyColor)
		: STICKY_COLORS[0];
	return {
		text: typeof parsed.text === 'string' ? parsed.text : '',
		color,
	};
}

export function loadStickyNote(instanceKey: string): StickyNoteData {
	try {
		const raw = localStorage.getItem(storageKey(instanceKey));
		if (!raw) {
			return { text: '', color: STICKY_COLORS[0] };
		}
		return parseSticky(JSON.parse(raw) as unknown);
	} catch {
		return { text: '', color: STICKY_COLORS[0] };
	}
}

export function saveStickyNote(instanceKey: string, data: StickyNoteData): void {
	try {
		localStorage.setItem(storageKey(instanceKey), JSON.stringify(data));
	} catch {
		/* ignore quota */
	}
	void userDataApi.upsert({ code: remoteCode(instanceKey), value: data });
}

/** Server copy wins; localStorage is the offline cache and migration source. */
export async function hydrateStickyNote(instanceKey: string): Promise<StickyNoteData> {
	const local = loadStickyNote(instanceKey);
	try {
		const dto = await userDataApi.getOptional(remoteCode(instanceKey));
		if (dto) {
			const remote = parseSticky(dto.value);
			localStorage.setItem(storageKey(instanceKey), JSON.stringify(remote));
			return remote;
		}
		if (localStorage.getItem(storageKey(instanceKey))) {
			await userDataApi.upsert({ code: remoteCode(instanceKey), value: local });
		}
	} catch {
		/* keep local */
	}
	return local;
}
