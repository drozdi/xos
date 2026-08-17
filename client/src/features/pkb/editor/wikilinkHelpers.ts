export interface ParsedWikilink {
	title: string;
	alias: string | null;
	heading: string | null;
	raw: string;
}

/** Matches `[[title]]`, `[[title|alias]]`, `[[title#heading]]`, `[[title#heading|alias]]`. */
export const WIKILINK_PATTERN = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

export function normalizeWikilinkTitle(raw: string): string {
	const trimmed = raw.trim();
	return trimmed.replace(/\s+/g, ' ');
}

export function parseWikilinkMarkdown(raw: string): ParsedWikilink | null {
	const match = /^\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]$/.exec(raw.trim());
	if (!match) {
		return null;
	}
	const title = normalizeWikilinkTitle(match[1] ?? '');
	if (!title) {
		return null;
	}
	const heading = match[2]?.trim() || null;
	const alias = match[3]?.trim() || null;
	return { title, alias, heading, raw: match[0] };
}

export function formatWikilinkMarkdown(title: string, alias?: string | null, heading?: string | null): string {
	const normalizedTitle = normalizeWikilinkTitle(title);
	if (!normalizedTitle) {
		return '[[]]';
	}
	const headingPart = heading ? `#${heading}` : '';
	if (alias && alias !== normalizedTitle) {
		return `[[${normalizedTitle}${headingPart}|${alias}]]`;
	}
	return `[[${normalizedTitle}${headingPart}]]`;
}

export function getWikilinkDisplayText(link: Pick<ParsedWikilink, 'title' | 'alias'>): string {
	return link.alias ?? link.title;
}

export interface WikilinkTextSegment {
	type: 'text' | 'wikilink';
	value: string;
	link?: ParsedWikilink;
}

export function splitMarkdownByWikilinks(content: string): WikilinkTextSegment[] {
	const segments: WikilinkTextSegment[] = [];
	let lastIndex = 0;
	const pattern = new RegExp(WIKILINK_PATTERN.source, 'g');
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(content)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
		}
		const parsed = parseWikilinkMarkdown(match[0]);
		if (parsed) {
			segments.push({ type: 'wikilink', value: match[0], link: parsed });
		} else {
			segments.push({ type: 'text', value: match[0] });
		}
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		segments.push({ type: 'text', value: content.slice(lastIndex) });
	}

	return segments.length > 0 ? segments : [{ type: 'text', value: content }];
}

export function filterNotesByTitle<T extends { title: string }>(
	notes: T[],
	query: string,
	limit = 12,
): T[] {
	const normalizedQuery = normalizeWikilinkTitle(query).toLowerCase();
	if (!normalizedQuery) {
		return notes.slice(0, limit);
	}
	return notes
		.filter((note) => note.title.toLowerCase().includes(normalizedQuery))
		.slice(0, limit);
}
