/** Make image URL safe for markdown `![alt](url)` (spaces etc.). */
export function markdownSafeSrc(src: string): string {
	try {
		return encodeURI(decodeURI(src));
	} catch {
		return encodeURI(src);
	}
}

/** Insert `![alt](src)` into markdown at selection (or append). */
export function insertMarkdownImage(
	content: string,
	alt: string,
	src: string,
	selectionStart = content.length,
	selectionEnd = selectionStart,
): { value: string; selectionStart: number; selectionEnd: number } {
	const safeAlt = alt.replace(/[[\]]/g, '') || 'image';
	const snippet = `![${safeAlt}](${markdownSafeSrc(src)})`;
	const before = content.slice(0, selectionStart);
	const after = content.slice(selectionEnd);
	const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
	const needsTrailingNewline = after.length > 0 && !after.startsWith('\n');
	const prefix = needsLeadingNewline ? '\n' : '';
	const suffix = needsTrailingNewline ? '\n' : '';
	const inserted = `${prefix}${snippet}${suffix}`;
	const value = `${before}${inserted}${after}`;
	const cursor = before.length + inserted.length;
	return { value, selectionStart: cursor, selectionEnd: cursor };
}
