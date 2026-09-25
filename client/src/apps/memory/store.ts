import { create } from 'zustand';

import { allMatched, createDeck, type MemoryCard } from './gameLogic';

interface MemoryState {
	cards: MemoryCard[];
	flippedIds: number[];
	moves: number;
	locked: boolean;
	won: boolean;
	newGame: () => void;
	flip: (id: number) => void;
	resolveMismatch: () => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
	cards: createDeck(),
	flippedIds: [],
	moves: 0,
	locked: false,
	won: false,
	newGame: () =>
		set({
			cards: createDeck(),
			flippedIds: [],
			moves: 0,
			locked: false,
			won: false,
		}),
	flip: (id) => {
		const state = get();
		if (state.locked || state.won) {
			return;
		}
		const card = state.cards.find((c) => c.id === id);
		if (!card || card.flipped || card.matched) {
			return;
		}
		if (state.flippedIds.length >= 2) {
			return;
		}

		const cards = state.cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
		const flippedIds = [...state.flippedIds, id];
		set({ cards, flippedIds });

		if (flippedIds.length < 2) {
			return;
		}

		const [aId, bId] = flippedIds;
		const a = cards.find((c) => c.id === aId);
		const b = cards.find((c) => c.id === bId);
		const moves = state.moves + 1;

		if (a && b && a.symbol === b.symbol) {
			const matched = cards.map((c) =>
				c.id === aId || c.id === bId ? { ...c, matched: true } : c,
			);
			set({
				cards: matched,
				flippedIds: [],
				moves,
				won: allMatched(matched),
			});
			return;
		}

		set({ locked: true, moves });
	},
	resolveMismatch: () => {
		const { flippedIds, cards } = get();
		if (flippedIds.length !== 2) {
			return;
		}
		const [aId, bId] = flippedIds;
		set({
			cards: cards.map((c) =>
				c.id === aId || c.id === bId ? { ...c, flipped: false } : c,
			),
			flippedIds: [],
			locked: false,
		});
	},
}));
