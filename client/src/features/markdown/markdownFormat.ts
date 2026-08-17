export type MarkdownFormatCommand =
	| 'bold'
	| 'italic'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'ul'
	| 'ol'
	| 'quote'
	| 'code'
	| 'codeBlock'
	| 'link'
	| 'hr';

export function applyMarkdownFormat(
	value: string,
	selectionStart: number,
	selectionEnd: number,
	command: MarkdownFormatCommand,
): { value: string; selectionStart: number; selectionEnd: number } {
	const selected = value.slice(selectionStart, selectionEnd);
	const before = value.slice(0, selectionStart);
	const after = value.slice(selectionEnd);

	const wrap = (prefix: string, suffix = prefix, placeholder = 'текст') => {
		const inner = selected || placeholder;
		const next = `${before}${prefix}${inner}${suffix}${after}`;
		const start = before.length + prefix.length;
		return {
			value: next,
			selectionStart: start,
			selectionEnd: start + inner.length,
		};
	};

	const prefixLines = (prefix: string) => {
		const block = selected || 'элемент';
		const lines = block.split('\n').map((line) => `${prefix}${line}`);
		const joined = lines.join('\n');
		const next = `${before}${joined}${after}`;
		return {
			value: next,
			selectionStart: before.length,
			selectionEnd: before.length + joined.length,
		};
	};

	switch (command) {
		case 'bold':
			return wrap('**');
		case 'italic':
			return wrap('*');
		case 'code':
			return wrap('`');
		case 'link': {
			const label = selected || 'ссылка';
			const next = `${before}[${label}](url)${after}`;
			const urlStart = before.length + label.length + 3;
			return {
				value: next,
				selectionStart: urlStart,
				selectionEnd: urlStart + 3,
			};
		}
		case 'heading1':
			return prefixLines('# ');
		case 'heading2':
			return prefixLines('## ');
		case 'heading3':
			return prefixLines('### ');
		case 'ul':
			return prefixLines('- ');
		case 'ol':
			return prefixLines('1. ');
		case 'quote':
			return prefixLines('> ');
		case 'codeBlock': {
			const inner = selected || 'code';
			const block = `\`\`\`\n${inner}\n\`\`\``;
			const next = `${before}${block}${after}`;
			const start = before.length + 4;
			return {
				value: next,
				selectionStart: start,
				selectionEnd: start + inner.length,
			};
		}
		case 'hr': {
			const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
			const needsTrailingNewline = after.length > 0 && !after.startsWith('\n');
			const block = `${needsLeadingNewline ? '\n' : ''}\n---\n${needsTrailingNewline ? '\n' : ''}`;
			const next = `${before}${block}${after}`;
			const cursor = before.length + block.length;
			return { value: next, selectionStart: cursor, selectionEnd: cursor };
		}
		default:
			return { value, selectionStart, selectionEnd };
	}
}
