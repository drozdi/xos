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

export function loadStickyNote(instanceKey: string): StickyNoteData {
	try {
		const raw = localStorage.getItem(storageKey(instanceKey));
		if (!raw) {
			return { text: '', color: STICKY_COLORS[0] };
		}
		const parsed = JSON.parse(raw) as Partial<StickyNoteData>;
		const color = STICKY_COLORS.includes(parsed.color as StickyColor)
			? (parsed.color as StickyColor)
			: STICKY_COLORS[0];
		return {
			text: typeof parsed.text === 'string' ? parsed.text : '',
			color,
		};
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
}
