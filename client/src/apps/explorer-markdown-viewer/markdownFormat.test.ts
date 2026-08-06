import { describe, expect, it } from 'vitest';

import { applyMarkdownFormat } from './markdownFormat';

describe('applyMarkdownFormat', () => {
	it('wraps selection with bold markers', () => {
		expect(applyMarkdownFormat('hello world', 6, 11, 'bold')).toEqual({
			value: 'hello **world**',
			selectionStart: 8,
			selectionEnd: 13,
		});
	});

	it('prefixes lines for headings and lists', () => {
		expect(applyMarkdownFormat('title', 0, 5, 'heading1').value).toBe('# title');
		expect(applyMarkdownFormat('a\nb', 0, 3, 'ul').value).toBe('- a\n- b');
	});

	it('inserts link with url selected', () => {
		const result = applyMarkdownFormat('go here', 3, 7, 'link');
		expect(result.value).toBe('go [here](url)');
		expect(result.selectionStart).toBe(10);
		expect(result.selectionEnd).toBe(13);
	});
});
