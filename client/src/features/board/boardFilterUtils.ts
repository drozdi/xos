import type { BoardFilterParams } from '@/core/api/endpoints/boardApi';

import type { BoardUiFilters } from './boardPrefs';

export function isBoardFiltersActive(filters: BoardUiFilters): boolean {
	return (
		filters.assigneeIds.length > 0 ||
		filters.labelIds.length > 0 ||
		Boolean(filters.dueAfter) ||
		Boolean(filters.dueBefore) ||
		filters.q.trim().length > 0
	);
}

export function toBoardFilterApiParams(filters: BoardUiFilters): BoardFilterParams {
	const params: BoardFilterParams = {};
	if (filters.assigneeIds.length > 0) {
		params.assignee = filters.assigneeIds;
	}
	if (filters.labelIds.length > 0) {
		params.label = filters.labelIds;
	}
	if (filters.dueAfter) {
		params.due_after = filters.dueAfter;
	}
	if (filters.dueBefore) {
		params.due_before = filters.dueBefore;
	}
	const q = filters.q.trim();
	if (q) {
		params.q = q;
	}
	return params;
}

export function isCardDimmed(cardId: number, matchingIds: Set<number> | null): boolean {
	if (matchingIds === null) {
		return false;
	}
	return !matchingIds.has(cardId);
}
