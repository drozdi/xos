import type { PkbFileTreeNode } from '@/core/api/endpoints/pkbApi';

export interface DailyNotesConfig {
	enabled: boolean;
	format: string;
	folder: string;
}

/**
 * Resolves daily note path from vault config and date.
 * Format YYYY-MM-DD → `Daily/2026-08-17.md`
 */
export function resolveDailyNotePath(
	config: { dailyNotes?: DailyNotesConfig } | null | undefined,
	date: Date = new Date(),
): string {
	const dailyNotes = config?.dailyNotes ?? {
		enabled: false,
		format: 'YYYY-MM-DD',
		folder: 'Daily',
	};
	const folder = (dailyNotes.folder || 'Daily').replace(/^\/+|\/+$/g, '');
	const format = dailyNotes.format || 'YYYY-MM-DD';

	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	let filename = format
		.replace(/YYYY/g, year)
		.replace(/MM/g, month)
		.replace(/DD/g, day);

	if (!filename.endsWith('.md')) {
		filename = `${filename}.md`;
	}

	return folder ? `${folder}/${filename}` : filename;
}

export function collectMarkdownPaths(nodes: PkbFileTreeNode[]): string[] {
	const paths: string[] = [];
	for (const node of nodes) {
		if (node.type === 'file' && /\.(md|markdown|mdown)$/i.test(node.path)) {
			paths.push(node.path);
		}
		if (node.children) {
			paths.push(...collectMarkdownPaths(node.children));
		}
	}
	return paths;
}
