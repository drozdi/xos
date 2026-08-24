import { create } from 'zustand';

import { useChildWindowStore } from '@/core/windowManager/childWindowStore';

import {
	DEFAULT_DIFFICULTY,
	type MinesweeperDifficulty,
	getDifficulty,
} from './difficulty';
import {
	type Cell,
	type GameStatus,
	checkWin,
	chordReveal,
	countFlags,
	createEmptyBoard,
	placeMines,
	revealAllMines,
	revealFlood,
	toggleFlag,
} from './gameLogic';

interface MinesweeperState {
	difficulty: MinesweeperDifficulty;
	board: Cell[];
	status: GameStatus;
	minesPlaced: boolean;
	elapsedSec: number;
	activeDialogId: string | null;
	startGame: (difficulty: MinesweeperDifficulty) => void;
	openCell: (index: number) => void;
	flagCell: (index: number) => void;
	chordCell: (index: number) => void;
	tick: () => void;
	setActiveDialogId: (id: string | null) => void;
	closeActiveDialog: (parentWindowId: string) => void;
}

function createGame(difficulty: MinesweeperDifficulty = DEFAULT_DIFFICULTY) {
	return {
		difficulty,
		board: createEmptyBoard(difficulty.rows, difficulty.cols),
		status: 'ready' as GameStatus,
		minesPlaced: false,
		elapsedSec: 0,
		activeDialogId: null as string | null,
	};
}

export const useMinesweeperStore = create<MinesweeperState>((set, get) => ({
	...createGame(),

	startGame: (difficulty) => {
		set(createGame(difficulty));
	},

	openCell: (index) => {
		const state = get();
		if (state.status === 'won' || state.status === 'lost') {
			return;
		}
		const cell = state.board[index];
		if (!cell || cell.state === 'flagged' || cell.state === 'open') {
			return;
		}

		let board = state.board;
		let minesPlaced = state.minesPlaced;
		if (!minesPlaced) {
			board = placeMines(
				board,
				state.difficulty.rows,
				state.difficulty.cols,
				state.difficulty.mines,
				index,
			);
			minesPlaced = true;
		}

		if (board[index]!.mine) {
			set({
				board: revealAllMines(board),
				minesPlaced,
				status: 'lost',
			});
			return;
		}

		board = revealFlood(board, state.difficulty.rows, state.difficulty.cols, index);
		const won = checkWin(board);
		set({
			board,
			minesPlaced,
			status: won ? 'won' : 'playing',
		});
	},

	flagCell: (index) => {
		const state = get();
		if (state.status === 'won' || state.status === 'lost') {
			return;
		}
		const board = toggleFlag(state.board, index);
		set({
			board,
			status: state.status === 'ready' ? 'playing' : state.status,
		});
	},

	chordCell: (index) => {
		const state = get();
		if (state.status !== 'playing' && state.status !== 'ready') {
			return;
		}
		const { board, hitMine } = chordReveal(
			state.board,
			state.difficulty.rows,
			state.difficulty.cols,
			index,
		);
		if (hitMine) {
			set({ board: revealAllMines(board), status: 'lost' });
			return;
		}
		set({
			board,
			status: checkWin(board) ? 'won' : 'playing',
		});
	},

	tick: () => {
		const state = get();
		if (state.status !== 'playing') {
			return;
		}
		set({ elapsedSec: state.elapsedSec + 1 });
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

export function remainingMines(state: {
	difficulty: MinesweeperDifficulty;
	board: Cell[];
}): number {
	return Math.max(0, state.difficulty.mines - countFlags(state.board));
}

export { getDifficulty };
