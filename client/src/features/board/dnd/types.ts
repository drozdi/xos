import type { UniqueIdentifier } from '@dnd-kit/core';

import type { BoardCard, BoardList } from '@/core/api/endpoints/boardApi';

export const POSITION_GAP = 1024;

export type DragItemType = 'list' | 'card';

export type ActiveDragItem =
	| { type: 'list'; list: BoardList }
	| { type: 'card'; card: BoardCard; listId: number };

export function dragId(type: DragItemType, id: number): string {
	return `${type}:${id}`;
}

export function listDropId(listId: number): string {
	return `list-drop:${listId}`;
}

export function parseDragId(id: UniqueIdentifier): { type: DragItemType; id: number } | null {
	const value = String(id);
	if (value.startsWith('list:')) {
		return { type: 'list', id: Number(value.slice(5)) };
	}
	if (value.startsWith('card:')) {
		return { type: 'card', id: Number(value.slice(5)) };
	}
	if (value.startsWith('list-drop:')) {
		return { type: 'list', id: Number(value.slice(10)) };
	}
	return null;
}

export function findListIdByCardId(lists: BoardList[], cardId: number): number | null {
	for (const list of lists) {
		if (list.cards.some((card) => card.id === cardId)) {
			return list.id;
		}
	}
	return null;
}

export function computePosition(items: { position: number }[], targetIndex: number): number {
	if (items.length === 0) {
		return POSITION_GAP;
	}
	if (targetIndex <= 0) {
		const first = items[0];
		return first ? Math.max(1, Math.floor(first.position / 2)) : POSITION_GAP;
	}
	if (targetIndex >= items.length) {
		const last = items[items.length - 1];
		return last ? last.position + POSITION_GAP : POSITION_GAP;
	}
	const prev = items[targetIndex - 1];
	const next = items[targetIndex];
	if (!prev || !next) {
		return POSITION_GAP;
	}
	return Math.floor((prev.position + next.position) / 2);
}

export function computeOrderIndex(lists: BoardList[], targetIndex: number): number {
	const indexes = lists.map((list) => list.order_index);
	if (indexes.length === 0) {
		return POSITION_GAP;
	}
	if (targetIndex <= 0) {
		const first = indexes[0];
		return first ? Math.max(1, Math.floor(first / 2)) : POSITION_GAP;
	}
	if (targetIndex >= indexes.length) {
		const last = indexes[indexes.length - 1];
		return last ? last + POSITION_GAP : POSITION_GAP;
	}
	const prev = indexes[targetIndex - 1];
	const next = indexes[targetIndex];
	if (prev === undefined || next === undefined) {
		return POSITION_GAP;
	}
	return Math.floor((prev + next) / 2);
}
