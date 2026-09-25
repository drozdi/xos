import { create } from 'zustand';

import {
	canMove,
	createInitialBoard,
	has2048,
	moveBoard,
	readBestScore,
	spawnTile,
	writeBestScore,
	type Board,
	type Direction,
} from './gameLogic';

export type Game2048Status = 'playing' | 'won' | 'lost';

interface Game2048State {
	board: Board;
	score: number;
	best: number;
	status: Game2048Status;
	wonAcknowledged: boolean;
	newGame: () => void;
	move: (direction: Direction) => void;
	continueAfterWin: () => void;
}

export const useGame2048Store = create<Game2048State>((set, get) => ({
	board: createInitialBoard(),
	score: 0,
	best: readBestScore(),
	status: 'playing',
	wonAcknowledged: false,
	newGame: () => {
		set({
			board: createInitialBoard(),
			score: 0,
			status: 'playing',
			wonAcknowledged: false,
			best: readBestScore(),
		});
	},
	continueAfterWin: () => set({ wonAcknowledged: true, status: 'playing' }),
	move: (direction) => {
		const state = get();
		if (state.status === 'lost') {
			return;
		}
		if (state.status === 'won' && !state.wonAcknowledged) {
			return;
		}
		const result = moveBoard(state.board, direction);
		if (!result.moved) {
			return;
		}
		const nextBoard = spawnTile(result.board);
		const score = state.score + result.gained;
		const best = Math.max(state.best, score);
		if (best > state.best) {
			writeBestScore(best);
		}
		let status: Game2048Status = 'playing';
		if (!state.wonAcknowledged && has2048(nextBoard)) {
			status = 'won';
		} else if (!canMove(nextBoard)) {
			status = 'lost';
		}
		set({ board: nextBoard, score, best, status });
	},
}));
