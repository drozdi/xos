import { describe, expect, it } from 'vitest';

import { insertMarkdownImage } from '@/features/iblock-content/insertMarkdownImage';
import { stringListFromProperty } from '@/features/iblock-content/propertyValues';
import { slugifyCode } from '@/features/iblock-content/slugifyCode';
import { validateRecipeForm } from '@/apps/recipe/recipeValidation';

function nextUniqueCode(base: string, used: Set<string>): string {
	if (!used.has(base)) return base;
	let n = 2;
	while (used.has(`${base}-${n}`)) n += 1;
	return `${base}-${n}`;
}

function validateContentName(data: { name?: string; block_id?: number | null }) {
	const errors: { name?: string; block_id?: string } = {};
	if (!data.name?.trim()) errors.name = 'Укажите название';
	if (!data.block_id) errors.block_id = 'Инфоблок не загружен';
	return errors;
}

describe('insertMarkdownImage', () => {
	it('appends image markdown at end', () => {
		const result = insertMarkdownImage('Hello', 'photo.png', '/uploads/a.png');
		expect(result.value).toContain('![photo.png](/uploads/a.png)');
		expect(result.value.startsWith('Hello')).toBe(true);
	});

	it('encodes spaces in image src for markdown', () => {
		const result = insertMarkdownImage('', 'a b.png', '/uploads/a b.png');
		expect(result.value).toBe('![a b.png](/uploads/a%20b.png)');
	});
});

describe('stringListFromProperty', () => {
	it('keeps empty rows for ingredient UI', () => {
		expect(stringListFromProperty(['мука', ''])).toEqual(['мука', '']);
		expect(stringListFromProperty(['', ''])).toEqual(['', '']);
	});
});

describe('slugifyCode / unique suffix', () => {
	it('transliterates cyrillic', () => {
		expect(slugifyCode('Томатный суп')).toBe('tomatnyy-sup');
	});

	it('appends number when code exists', () => {
		const base = slugifyCode('Блины');
		const used = new Set([base, `${base}-2`]);
		expect(nextUniqueCode(base, used)).toBe(`${base}-3`);
	});
});

describe('content/recipe validation', () => {
	it('requires name and block', () => {
		expect(validateContentName({ name: '', block_id: null }).name).toBeTruthy();
		expect(validateRecipeForm({ name: 'Soup', block_id: 1 } as never).name).toBeUndefined();
	});
});
