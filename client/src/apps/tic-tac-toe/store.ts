import { create } from 'zustand';

import { checkGameResult, createEmptyField, type CellValue, type Player } from './gameLogic';

interface TicTacToeState {
	isEnd: boolean;
	player: Player;
	isDraw: boolean;
	field: CellValue[];
	playMove: (index: number) => void;
	setWinner: (player: Player) => void;
	draw: () => void;
	restart: () => void;
}

const initialState = {
	isEnd: false,
	player: 'X' as Player,
	isDraw: false,
	field: createEmptyField(),
};

export const useTicTacToeStore = create<TicTacToeState>((set, get) => ({
	...initialState,

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

	restart: () => {
		set(initialState);
	},
}));
