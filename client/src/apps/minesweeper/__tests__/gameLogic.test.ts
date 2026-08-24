import { describe, expect, it } from 'vitest';

import {
	checkWin,
	createEmptyBoard,
	placeMines,
	revealFlood,
	toggleFlag,
} from '../gameLogic';

describe('minesweeper gameLogic', () => {
	it('places exact mine count and keeps first click safe', () => {
		const rows = 9;
		const cols = 9;
		const mines = 10;
		const safeIndex = 40;
		const board = placeMines(createEmptyBoard(rows, cols), rows, cols, mines, safeIndex);
		expect(board.filter((c) => c.mine)).toHaveLength(mines);
		expect(board[safeIndex]!.mine).toBe(false);
	});

	it('flood-opens empty region', () => {
		const rows = 3;
		const cols = 3;
		let board = createEmptyBoard(rows, cols);
		board = placeMines(board, rows, cols, 1, 0);
		const mineIndex = board.findIndex((c) => c.mine);
		expect(mineIndex).toBeGreaterThanOrEqual(0);
		const openIndex = board.findIndex((c) => !c.mine && c.adjacent === 0);
		if (openIndex >= 0) {
			board = revealFlood(board, rows, cols, openIndex);
			expect(board[openIndex]!.state).toBe('open');
		}
	});

	it('toggles flags and detects win', () => {
		let board = createEmptyBoard(2, 2);
		board[0]!.mine = true;
		board[1]!.state = 'open';
		board[2]!.state = 'open';
		board[3]!.state = 'open';
		expect(checkWin(board)).toBe(true);
		board = toggleFlag(board, 0);
		expect(board[0]!.state).toBe('flagged');
	});
});
