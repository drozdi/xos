import { describe, expect, it } from 'vitest';

import {
	boardsEqual,
	canMove,
	createInitialBoard,
	emptyBoard,
	has2048,
	moveBoard,
} from '../gameLogic';

describe('game-2048 logic', () => {
	it('creates board with two tiles', () => {
		const board = createInitialBoard(() => 0.5);
		const filled = board.flat().filter((v) => v !== 0);
		expect(filled).toHaveLength(2);
	});

	it('merges tiles left and scores', () => {
		const board = emptyBoard();
		board[0] = [2, 2, 0, 0];
		const result = moveBoard(board, 'left');
		expect(result.moved).toBe(true);
		expect(result.board[0]).toEqual([4, 0, 0, 0]);
		expect(result.gained).toBe(4);
	});

	it('detects no moves', () => {
		const board = [
			[2, 4, 2, 4],
			[4, 2, 4, 2],
			[2, 4, 2, 4],
			[4, 2, 4, 2],
		];
		expect(canMove(board)).toBe(false);
		expect(boardsEqual(board, board)).toBe(true);
	});

	it('detects 2048 tile', () => {
		const board = emptyBoard();
		board[1]![1] = 2048;
		expect(has2048(board)).toBe(true);
	});
});
