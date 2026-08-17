import { z } from 'zod';

export const BOARD_PREFS = {
	filters: 'board.ui.filters',
	lastBoardId: 'board.ui.lastBoardId',
} as const;

export const boardUiFiltersSchema = z.object({
	assigneeIds: z.array(z.number()).default([]),
	labelIds: z.array(z.number()).default([]),
	dueAfter: z.string().nullable().optional(),
	dueBefore: z.string().nullable().optional(),
	q: z.string().default(''),
});

export const boardFiltersPrefsSchema = z.object({
	boards: z.record(z.string(), boardUiFiltersSchema).default({}),
});

export type BoardUiFilters = z.infer<typeof boardUiFiltersSchema>;
export type BoardFiltersPrefs = z.infer<typeof boardFiltersPrefsSchema>;

export const emptyBoardUiFilters = (): BoardUiFilters => ({
	assigneeIds: [],
	labelIds: [],
	dueAfter: null,
	dueBefore: null,
	q: '',
});
