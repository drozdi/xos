import { describe, expect, it } from 'vitest';

import { buildGameConfig, getClueCount } from '../difficulty';
import {
	clearNoteFromCells,
	createPuzzle,
	generatePuzzle,
	generateSolution,
	getRelatedCellIndices,
	hasConflict,
	hasNote,
	isBoardComplete,
	toggleNoteMask,
} from '../gameLogic';

function countFilled(values: number[]): number {
	return values.filter((value) => value !== 0).length;
}

function isValidBoard(board: number[], size: number, boxRows: number, boxCols: number): boolean {
	for (let row = 0; row < size; row += 1) {
		const rowSet = new Set<number>();
		for (let col = 0; col < size; col += 1) {
			const value = board[row * size + col]!;
			if (value === 0 || rowSet.has(value)) {
				return false;
			}
			rowSet.add(value);
		}
	}

	for (let col = 0; col < size; col += 1) {
		const colSet = new Set<number>();
		for (let row = 0; row < size; row += 1) {
			const value = board[row * size + col]!;
			if (value === 0 || colSet.has(value)) {
				return false;
			}
			colSet.add(value);
		}
	}

	for (let boxRow = 0; boxRow < size / boxRows; boxRow += 1) {
		for (let boxCol = 0; boxCol < size / boxCols; boxCol += 1) {
			const boxSet = new Set<number>();
			for (let row = 0; row < boxRows; row += 1) {
				for (let col = 0; col < boxCols; col += 1) {
					const value = board[(boxRow * boxRows + row) * size + boxCol * boxCols + col]!;
					if (value === 0 || boxSet.has(value)) {
						return false;
					}
					boxSet.add(value);
				}
			}
		}
	}

	return true;
}

describe('sudoku gameLogic', () => {
	it('generates valid 9x9 solution', () => {
		const config = buildGameConfig('9x9', 'easy')!;
		const solution = generateSolution(config.size);
		expect(solution).toHaveLength(81);
		expect(isValidBoard(solution, 9, 3, 3)).toBe(true);
	});

	it('creates puzzle with requested clue count', () => {
		const config = buildGameConfig('4x4', 'hard')!;
		const solution = generateSolution(config.size);
		const puzzle = createPuzzle(solution, config.size, config.clueCount);
		expect(countFilled(puzzle.givens)).toBe(getClueCount('4x4', 'hard'));
	});

	it('generatePuzzle produces solvable board', () => {
		const config = buildGameConfig('6x6', 'medium')!;
		const puzzle = generatePuzzle(config);
		expect(puzzle.solution).toHaveLength(36);
		expect(countFilled(puzzle.givens)).toBe(config.clueCount);
	});

	it('detects conflicts and completion', () => {
		const config = buildGameConfig('4x4', 'easy')!;
		const solution = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
		const values = [...solution];
		values[0] = values[1]!;
		expect(hasConflict(values, config.size, 0)).toBe(true);
		expect(isBoardComplete(solution, solution)).toBe(true);
	});

	it('toggles pencil notes', () => {
		let notes = 0;
		notes = toggleNoteMask(notes, 3);
		expect(hasNote(notes, 3)).toBe(true);
		notes = toggleNoteMask(notes, 3);
		expect(hasNote(notes, 3)).toBe(false);
	});

	it('clears note from related cells', () => {
		const config = buildGameConfig('4x4', 'easy')!;
		const notes = [0, 1 << 1, 0, 1 << 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		const related = getRelatedCellIndices(config.size, 0);
		const cleared = clearNoteFromCells(notes, related, 2);
		expect(hasNote(cleared[1]!, 2)).toBe(false);
		expect(hasNote(cleared[3]!, 2)).toBe(false);
	});
});