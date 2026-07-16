import { create } from 'zustand';

import { useChildWindowStore } from '@/core/windowManager/childWindowStore';

import { DEFAULT_DIFFICULTY, type Difficulty } from './difficulty';
import {
	checkGameResult,
	createEmptyField,
	generateWinLines,
	type CellValue,
	type Player,
} from './gameLogic';

interface TicTacToeState {
	size: number;
	winLength: number;
	difficulty: Difficulty;
	winLines: number[][];
	isEnd: boolean;
	player: Player;
	isDraw: boolean;
	field: CellValue[];
	activeDialogId: string | null;
	playMove: (index: number) => void;
	setWinner: (player: Player) => void;
	draw: () => void;
	startGame: (difficulty: Difficulty) => void;
	setActiveDialogId: (id: string | null) => void;
	closeActiveDialog: (parentWindowId: string) => void;
}

function createGameState(difficulty: Difficulty = DEFAULT_DIFFICULTY) {
	const winLines = generateWinLines(difficulty.size, difficulty.winLength);
	return {
		size: difficulty.size,
		winLength: difficulty.winLength,
		difficulty,
		winLines,
		isEnd: false,
		player: 'X' as Player,
		isDraw: false,
		field: createEmptyField(difficulty.size),
		activeDialogId: null,
	};
}

export const useTicTacToeStore = create<TicTacToeState>((set, get) => ({
	...createGameState(),

	playMove: (index) => {
		const { isEnd, player, field } = get();
		if (isEnd || field[index]) {
			return;
		}

		const nextField = field.slice();
		nextField[index] = player;
		set({
			field: nextField,
			player: player === 'X' ? 'O' : 'X',
		});
	},

	setWinner: (player) => {
		set({ isEnd: true, player });
	},

	draw: () => {
		set({ isDraw: true, isEnd: true });
	},

	startGame: (difficulty) => {
		set(createGameState(difficulty));
	},

	setActiveDialogId: (id) => {
		set({ activeDialogId: id });
	},

	closeActiveDialog: (parentWindowId) => {
		const { activeDialogId } = get();
		if (!activeDialogId) {
			return;
		}
		useChildWindowStore.getState().removeChild(parentWindowId, activeDialogId);
		set({ activeDialogId: null });
	},
}));

export function getGameResultFromStore() {
	const { field, winLines } = useTicTacToeStore.getState();
	return checkGameResult(field, winLines);
}
