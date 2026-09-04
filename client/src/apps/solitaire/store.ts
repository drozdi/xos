import { create } from 'zustand';

import { useChildWindowStore } from '@/core/windowManager/childWindowStore';

import {
	type DrawMode,
	type PileRef,
	type SolitaireState,
	cloneState,
	dealKlondike,
	drawFromStock,
	isWon,
	autoMoveAllToFoundations,
	moveCards,
	tryAutoFoundation,
	tryAutoPlace,
} from './gameLogic';

interface StoreState extends SolitaireState {
	selected: PileRef | null;
	history: SolitaireState[];
	won: boolean;
	activeDialogId: string | null;
	startGame: (drawMode?: DrawMode) => void;
	undo: () => void;
	draw: () => void;
	selectPile: (ref: PileRef) => void;
	clearSelection: () => void;
	dropOnTableau: (col: number) => void;
	dropOnFoundation: (index: number) => void;
	autoMove: (ref: PileRef) => void;
	autoPlace: (ref: PileRef) => void;
	autoMoveAll: () => void;
	setActiveDialogId: (id: string | null) => void;
	closeActiveDialog: (parentWindowId: string) => void;
}

function pushHistory(state: StoreState): SolitaireState[] {
	const snapshot = cloneState(state);
	return [...state.history, snapshot].slice(-40);
}

export const useSolitaireStore = create<StoreState>((set, get) => ({
	...dealKlondike(3),
	selected: null,
	history: [],
	won: false,
	activeDialogId: null,

	startGame: (drawMode = 3) => {
		set({
			...dealKlondike(drawMode),
			selected: null,
			history: [],
			won: false,
			activeDialogId: null,
		});
	},

	undo: () => {
		const state = get();
		const prev = state.history[state.history.length - 1];
		if (!prev) {
			return;
		}
		set({
			...cloneState(prev),
			history: state.history.slice(0, -1),
			selected: null,
			won: isWon(prev),
		});
	},

	draw: () => {
		const state = get();
		const next = drawFromStock(state);
		set({
			...next,
			history: pushHistory(state),
			selected: null,
			won: false,
		});
	},

	selectPile: (ref) => {
		const state = get();
		if (state.won) {
			return;
		}
		if (
			state.selected &&
			state.selected.type === ref.type &&
			JSON.stringify(state.selected) === JSON.stringify(ref)
		) {
			set({ selected: null });
			return;
		}
		set({ selected: ref });
	},

	clearSelection: () => set({ selected: null }),

	dropOnTableau: (col) => {
		const state = get();
		if (!state.selected || state.won) {
			return;
		}
		const moved = moveCards(state, state.selected, { type: 'tableau', col });
		if (!moved) {
			set({ selected: null });
			return;
		}
		set({
			...moved,
			history: pushHistory(state),
			selected: null,
			won: isWon(moved),
		});
	},

	dropOnFoundation: (index) => {
		const state = get();
		if (!state.selected || state.won) {
			return;
		}
		const moved = moveCards(state, state.selected, { type: 'foundation', index });
		if (!moved) {
			set({ selected: null });
			return;
		}
		set({
			...moved,
			history: pushHistory(state),
			selected: null,
			won: isWon(moved),
		});
	},

	autoMove: (ref) => {
		const state = get();
		if (state.won) {
			return;
		}
		const moved = tryAutoFoundation(state, ref);
		if (!moved) {
			return;
		}
		set({
			...moved,
			history: pushHistory(state),
			selected: null,
			won: isWon(moved),
		});
	},

	autoPlace: (ref) => {
		const state = get();
		if (state.won) {
			return;
		}
		const moved = tryAutoPlace(state, ref);
		if (!moved) {
			return;
		}
		set({
			...moved,
			history: pushHistory(state),
			selected: null,
			won: isWon(moved),
		});
	},

	autoMoveAll: () => {
		const state = get();
		if (state.won) {
			return;
		}
		const moved = autoMoveAllToFoundations(state);
		if (!moved) {
			return;
		}
		set({
			...moved,
			history: pushHistory(state),
			selected: null,
			won: isWon(moved),
		});
	},

	setActiveDialogId: (id) => set({ activeDialogId: id }),

	closeActiveDialog: (parentWindowId) => {
		const id = get().activeDialogId;
		if (id) {
			useChildWindowStore.getState().close(parentWindowId, id);
		}
		set({ activeDialogId: null });
	},
}));
