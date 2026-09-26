export type PkbPluginHooks = {
	onRenderMarkdown?: (content: string) => string;
	onSaveNote?: (content: string) => string;
};

export type PkbPlugin = {
	id: string;
	name: string;
	description?: string;
} & PkbPluginHooks;

/** Insert a markdown TOC from AT1–H3 headings (demo plugin). */
function tocOnRenderMarkdown(content: string): string {
	const headingRe = /^(#{1,3})\s+(.+)$/gm;
	const entries: { level: number; text: string; anchor: string }[] = [];
	let match: RegExpExecArray | null;
	while ((match = headingRe.exec(content)) !== null) {
		const level = match[1]!.length;
		const text = match[2]!.trim();
		if (!text) {
			continue;
		}
		const anchor = text
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s-]+/gu, '')
			.trim()
			.replace(/\s+/g, '-');
		entries.push({ level, text, anchor });
	}
	if (entries.length < 2) {
		return content;
	}
	if (/^<!--\s*pkb-toc\s*-->/m.test(content)) {
		return content;
	}
	const lines = ['<!-- pkb-toc -->', '## Содержание', ''];
	for (const entry of entries) {
		const indent = '  '.repeat(Math.max(0, entry.level - 1));
		lines.push(`${indent}- [${entry.text}](#${entry.anchor})`);
	}
	lines.push('');
	return `${lines.join('\n')}${content}`;
}

export const tocPlugin: PkbPlugin = {
	id: 'toc',
	name: 'Table of Contents',
	description: 'Вставляет оглавление в начало предпросмотра',
	onRenderMarkdown: tocOnRenderMarkdown,
};

const registry = new Map<string, PkbPlugin>([[tocPlugin.id, tocPlugin]]);

export function registerPkbPlugin(plugin: PkbPlugin): void {
	registry.set(plugin.id, plugin);
}

export function getPkbPlugin(id: string): PkbPlugin | undefined {
	return registry.get(id);
}

export function listPkbPlugins(): PkbPlugin[] {
	return [...registry.values()];
}

export function applyPkbRenderPlugins(content: string, pluginIds: string[]): string {
	let result = content;
	for (const id of pluginIds) {
		const plugin = registry.get(id);
		if (plugin?.onRenderMarkdown) {
			result = plugin.onRenderMarkdown(result);
		}
	}
	return result;
}

export function applyPkbSavePlugins(content: string, pluginIds: string[]): string {
	let result = content;
	for (const id of pluginIds) {
		const plugin = registry.get(id);
		if (plugin?.onSaveNote) {
			result = plugin.onSaveNote(result);
		}
	}
	return result;
}
