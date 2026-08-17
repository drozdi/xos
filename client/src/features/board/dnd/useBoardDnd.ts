import {
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';

import type { BoardList } from '@/core/api/endpoints/boardApi';

import {
	type ActiveDragItem,
	computeOrderIndex,
	computePosition,
	dragId,
	findListIdByCardId,
	parseDragId,
} from './types';

export interface BoardDndMutations {
	onReorderLists: (orders: Array<{ id: number; order_index: number }>) => Promise<void>;
	onMoveCard: (cardId: number, listId: number, position: number) => Promise<void>;
}

interface UseBoardDndOptions {
	lists: BoardList[];
	onListsChange: (lists: BoardList[]) => void;
	canEdit: boolean;
	mutations: BoardDndMutations;
}

function resolveOverListId(lists: BoardList[], overId: string | number): number | null {
	const parsed = parseDragId(overId);
	if (!parsed) {
		return null;
	}
	if (parsed.type === 'list') {
		return parsed.id;
	}
	return findListIdByCardId(lists, parsed.id);
}

function moveCardBetweenLists(
	lists: BoardList[],
	cardId: number,
	fromListId: number,
	toListId: number,
	overCardId?: number,
): BoardList[] {
	const sourceList = lists.find((list) => list.id === fromListId);
	const targetList = lists.find((list) => list.id === toListId);
	if (!sourceList || !targetList) {
		return lists;
	}

	const card = sourceList.cards.find((item) => item.id === cardId);
	if (!card) {
		return lists;
	}

	const sourceCards = sourceList.cards.filter((item) => item.id !== cardId);
	let targetCards =
		toListId === fromListId ? sourceCards : targetList.cards.filter((item) => item.id !== cardId);

	if (overCardId !== undefined) {
		const overIndex = targetCards.findIndex((item) => item.id === overCardId);
		if (overIndex >= 0) {
			targetCards = [
				...targetCards.slice(0, overIndex),
				card,
				...targetCards.slice(overIndex),
			];
		} else {
			targetCards = [...targetCards, card];
		}
	} else {
		targetCards = [...targetCards, card];
	}

	return lists.map((list) => {
		if (list.id === fromListId && fromListId !== toListId) {
			return { ...list, cards: sourceCards };
		}
		if (list.id === toListId) {
			return { ...list, cards: targetCards };
		}
		return list;
	});
}

export function useBoardDnd({ lists, onListsChange, canEdit, mutations }: UseBoardDndOptions) {
	const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			if (!canEdit) {
				return;
			}

			const parsed = parseDragId(event.active.id);
			if (!parsed) {
				return;
			}

			if (parsed.type === 'list') {
				const list = lists.find((item) => item.id === parsed.id);
				if (list) {
					setActiveItem({ type: 'list', list });
				}
				return;
			}

			const listId = findListIdByCardId(lists, parsed.id);
			if (listId === null) {
				return;
			}
			const list = lists.find((item) => item.id === listId);
			const card = list?.cards.find((item) => item.id === parsed.id);
			if (card) {
				setActiveItem({ type: 'card', card, listId });
			}
		},
		[canEdit, lists],
	);

	const handleDragOver = useCallback(
		(event: DragOverEvent) => {
			if (!canEdit) {
				return;
			}

			const { active, over } = event;
			if (!over) {
				return;
			}

			const activeParsed = parseDragId(active.id);
			if (!activeParsed || activeParsed.type !== 'card') {
				return;
			}

			const activeListId = findListIdByCardId(lists, activeParsed.id);
			const overListId = resolveOverListId(lists, over.id);
			if (activeListId === null || overListId === null) {
				return;
			}

			const overParsed = parseDragId(over.id);
			const overCardId = overParsed?.type === 'card' ? overParsed.id : undefined;

			if (activeListId === overListId) {
				const list = lists.find((item) => item.id === activeListId);
				if (!list || overCardId === undefined) {
					return;
				}
				const oldIndex = list.cards.findIndex((item) => item.id === activeParsed.id);
				const newIndex = list.cards.findIndex((item) => item.id === overCardId);
				if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
					return;
				}
				onListsChange(
					lists.map((item) =>
						item.id === activeListId
							? { ...item, cards: arrayMove(item.cards, oldIndex, newIndex) }
							: item,
					),
				);
				return;
			}

			onListsChange(
				moveCardBetweenLists(lists, activeParsed.id, activeListId, overListId, overCardId),
			);
		},
		[canEdit, lists, onListsChange],
	);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			setActiveItem(null);
			if (!canEdit) {
				return;
			}

			const { active, over } = event;
			if (!over) {
				return;
			}

			const activeParsed = parseDragId(active.id);
			if (!activeParsed) {
				return;
			}

			if (activeParsed.type === 'list') {
				const oldIndex = lists.findIndex((item) => item.id === activeParsed.id);
				const overParsed = parseDragId(over.id);
				if (overParsed?.type !== 'list' || oldIndex < 0) {
					return;
				}
				const newIndex = lists.findIndex((item) => item.id === overParsed.id);
				if (newIndex < 0 || oldIndex === newIndex) {
					return;
				}

				const reordered = arrayMove(lists, oldIndex, newIndex);
				onListsChange(reordered);
				const movedList = reordered[newIndex];
				if (!movedList) {
					return;
				}
				const orderIndex = computeOrderIndex(reordered, newIndex);
				await mutations.onReorderLists([{ id: movedList.id, order_index: orderIndex }]);
				return;
			}

			const activeListId = findListIdByCardId(lists, activeParsed.id);
			const overListId = resolveOverListId(lists, over.id);
			if (activeListId === null || overListId === null) {
				return;
			}

			const targetList = lists.find((item) => item.id === overListId);
			if (!targetList) {
				return;
			}

			const cardIndex = targetList.cards.findIndex((item) => item.id === activeParsed.id);
			if (cardIndex < 0) {
				return;
			}

			const cardsWithoutActive = targetList.cards.filter((item) => item.id !== activeParsed.id);
			const position = computePosition(cardsWithoutActive, cardIndex);
			await mutations.onMoveCard(activeParsed.id, overListId, position);
		},
		[canEdit, lists, mutations, onListsChange],
	);

	const listIds = lists.map((list) => dragId('list', list.id));

	return {
		sensors,
		activeItem,
		listIds,
		handleDragStart,
		handleDragOver,
		handleDragEnd,
	};
}
