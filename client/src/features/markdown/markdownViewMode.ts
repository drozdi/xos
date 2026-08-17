export type MarkdownViewMode = 'live' | 'source' | 'reading';

export const MARKDOWN_VIEW_MODE_LABELS: Record<MarkdownViewMode, string> = {
	live: 'WYSIWYG',
	source: 'Исходный код',
	reading: 'Чтение',
};

export function normalizeMarkdownViewMode(mode: string | undefined): MarkdownViewMode {
	switch (mode) {
		case 'live':
		case 'source':
		case 'reading':
			return mode;
		case 'edit':
			return 'source';
		case 'preview':
			return 'reading';
		case 'split':
			return 'live';
		default:
			return 'live';
	}
}

export function showsMarkdownWysiwyg(mode: MarkdownViewMode): boolean {
	return mode === 'live';
}

export function showsMarkdownSource(mode: MarkdownViewMode): boolean {
	return mode === 'source';
}

export function showsMarkdownPreview(mode: MarkdownViewMode): boolean {
	return mode === 'reading';
}

export function defaultMarkdownViewMode(writable: boolean): MarkdownViewMode {
	return writable ? 'live' : 'reading';
}
