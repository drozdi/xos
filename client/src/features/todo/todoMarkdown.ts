import dayjs from 'dayjs';

export const TODO_COLORS = [
	'#fff59d',
	'#ffcc80',
	'#ef9a9a',
	'#ce93d8',
	'#90caf9',
	'#a5d6a7',
	'#e0e0e0',
	'#ffffff',
] as const;

export type TodoDraftItem = {
	text: string;
	done: boolean;
	due_at: string | null;
};

/** Собирает markdown чеклиста из items (+ notes после ---). */
export function itemsToMarkdown(items: TodoDraftItem[], notesMd?: string | null): string {
	const lines = items
		.filter((item) => item.text.trim() !== '')
		.map((item) => {
			const mark = item.done ? 'x' : ' ';
			let line = `- [${mark}] ${item.text.trim()}`;
			if (item.due_at) {
				line += ` | due:${dayjs(item.due_at).format('YYYY-MM-DD HH:mm')}`;
			}
			return line;
		});

	const body = lines.join('\n');
	const notes = notesMd?.trim() ?? '';
	if (!notes) {
		return body;
	}
	return body ? `${body}\n\n---\n\n${notes}` : notes;
}

export function parseMarkdown(markdown: string): { items: TodoDraftItem[]; notes_md: string | null } {
	const parts = markdown.split(/^\s*---\s*$/m);
	const checklistPart = parts[0] ?? '';
	const notes = parts[1]?.trim() || null;

	const items: TodoDraftItem[] = [];
	for (const rawLine of checklistPart.split(/\r\n|\n|\r/)) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}
		const match = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/u);
		if (!match) {
			continue;
		}
		const mark = match[1] ?? ' ';
		const done = mark.toLowerCase() === 'x';
		let rest = (match[2] ?? '').trim();
		let due_at: string | null = null;
		const dueMatch = rest.match(/^(.*?)\s*\|\s*due:\s*(.+)$/iu);
		if (dueMatch) {
			rest = (dueMatch[1] ?? '').trim();
			const dueRaw = (dueMatch[2] ?? '').trim();
			const parsed = dayjs(dueRaw);
			due_at = parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : null;
		}
		if (!rest) {
			continue;
		}
		items.push({ text: rest, done, due_at });
	}

	return { items, notes_md: notes };
}
