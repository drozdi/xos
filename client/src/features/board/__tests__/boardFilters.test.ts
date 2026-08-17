import { describe, expect, it } from 'vitest';

import { boardFilterResponseSchema } from '@/core/api/endpoints/boardApi';

import {
	isBoardFiltersActive,
	isCardDimmed,
	toBoardFilterApiParams,
} from '@/features/board/boardFilterUtils';
import { boardUiFiltersSchema, emptyBoardUiFilters } from '@/features/board/boardPrefs';

describe('boardFilters', () => {
	it('detects active filters', () => {
		expect(isBoardFiltersActive(emptyBoardUiFilters())).toBe(false);
		expect(
			isBoardFiltersActive({
				...emptyBoardUiFilters(),
				assigneeIds: [1],
			}),
		).toBe(true);
		expect(
			isBoardFiltersActive({
				...emptyBoardUiFilters(),
				q: 'bug',
			}),
		).toBe(true);
	});

	it('maps UI filters to API params', () => {
		const params = toBoardFilterApiParams({
			assigneeIds: [5],
			labelIds: [2],
			dueAfter: '2026-08-01',
			dueBefore: '2026-08-31',
			q: '  login  ',
		});

		expect(params).toEqual({
			assignee: [5],
			label: [2],
			due_after: '2026-08-01',
			due_before: '2026-08-31',
			q: 'login',
		});
	});

	it('dims cards outside matching set', () => {
		const matching = new Set([1, 3]);
		expect(isCardDimmed(1, matching)).toBe(false);
		expect(isCardDimmed(2, matching)).toBe(true);
		expect(isCardDimmed(2, null)).toBe(false);
	});

	it('parses board filter response schema', () => {
		const response = boardFilterResponseSchema.parse({
			card_ids: [10, 20],
			filtered: true,
		});
		expect(response.card_ids).toEqual([10, 20]);
	});

	it('parses board UI filters prefs', () => {
		const filters = boardUiFiltersSchema.parse({
			assigneeIds: [1],
			labelIds: [],
			q: '',
		});
		expect(filters.assigneeIds).toEqual([1]);
	});
});
