import { describe, expect, it } from 'vitest';

import {
	filterNotesByTitle,
	formatWikilinkMarkdown,
	getWikilinkDisplayText,
	normalizeWikilinkTitle,
	parseWikilinkMarkdown,
	splitMarkdownByWikilinks,
} from '@/features/pkb/editor/wikilinkHelpers';

describe('wikilinkHelpers', () => {
	describe('normalizeWikilinkTitle', () => {
		it('trims and collapses whitespace', () => {
			expect(normalizeWikilinkTitle('  Target   Note  ')).toBe('Target Note');
		});
	});

	describe('parseWikilinkMarkdown', () => {
		it('parses simple wikilink', () => {
			const parsed = parseWikilinkMarkdown('[[Target Note]]');
			expect(parsed).toEqual({
				title: 'Target Note',
				alias: null,
				heading: null,
				raw: '[[Target Note]]',
			});
		});

		it('parses wikilink with alias', () => {
			const parsed = parseWikilinkMarkdown('[[Target Note|alias text]]');
			expect(parsed?.title).toBe('Target Note');
			expect(parsed?.alias).toBe('alias text');
		});

		it('parses wikilink with heading', () => {
			const parsed = parseWikilinkMarkdown('[[Target Note#Section]]');
			expect(parsed?.title).toBe('Target Note');
			expect(parsed?.heading).toBe('Section');
		});
	});

	describe('formatWikilinkMarkdown', () => {
		it('formats title-only wikilink', () => {
			expect(formatWikilinkMarkdown('Target Note')).toBe('[[Target Note]]');
		});

		it('formats wikilink with alias', () => {
			expect(formatWikilinkMarkdown('Target Note', 'alias')).toBe('[[Target Note|alias]]');
		});

		it('skips alias when equal to title', () => {
			expect(formatWikilinkMarkdown('Target Note', 'Target Note')).toBe('[[Target Note]]');
		});
	});

	describe('getWikilinkDisplayText', () => {
		it('returns alias when present', () => {
			expect(getWikilinkDisplayText({ title: 'Target', alias: 'Link text' })).toBe('Link text');
		});
	});

	describe('splitMarkdownByWikilinks', () => {
		it('splits text around wikilinks', () => {
			const segments = splitMarkdownByWikilinks('See [[Target Note]] here');
			expect(segments).toHaveLength(3);
			expect(segments[0]).toEqual({ type: 'text', value: 'See ' });
			expect(segments[1]?.type).toBe('wikilink');
			expect(segments[2]).toEqual({ type: 'text', value: ' here' });
		});
	});

	describe('filterNotesByTitle', () => {
		const notes = [
			{ title: 'Alpha', path: 'Notes/Alpha.md' },
			{ title: 'Beta Note', path: 'Notes/Beta Note.md' },
		];

		it('returns all notes for empty query', () => {
			expect(filterNotesByTitle(notes, '')).toHaveLength(2);
		});

		it('filters by includes match', () => {
			expect(filterNotesByTitle(notes, 'beta')).toEqual([notes[1]]);
		});
	});
});
