import type { SudokuGameConfig, SudokuSizeConfig } from './difficulty';

export type InputMode = 'pen' | 'pencil';

export interface GeneratedPuzzle {
	solution: number[];
	givens: number[];
	givenMask: boolean[];
}

function shuffle<T>(items: T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j]!, result[i]!];
	}
	return result;
}

function getIndex(size: number, row: number, col: number): number {
	return row * size + col;
}

function getRowCol(size: number, index: number): { row: number; col: number } {
	return { row: Math.floor(index / size), col: index % size };
}

function isValidPlacement(
	board: number[],
	sizeConfig: SudokuSizeConfig,
	row: number,
	col: number,
	value: number,
): boolean {
	const { size, boxRows, boxCols } = sizeConfig;

	for (let c = 0; c < size; c += 1) {
		if (c !== col && board[getIndex(size, row, c)] === value) {
			return false;
		}
	}

	for (let r = 0; r < size; r += 1) {
		if (r !== row && board[getIndex(size, r, col)] === value) {
			return false;
		}
	}

	const boxRowStart = Math.floor(row / boxRows) * boxRows;
	const boxColStart = Math.floor(col / boxCols) * boxCols;
	for (let r = boxRowStart; r < boxRowStart + boxRows; r += 1) {
		for (let c = boxColStart; c < boxColStart + boxCols; c += 1) {
			if (r === row && c === col) {
				continue;
			}
			if (board[getIndex(size, r, c)] === value) {
				return false;
			}
		}
	}

	return true;
}

function fillBox(
	board: number[],
	sizeConfig: SudokuSizeConfig,
	boxRowIndex: number,
	boxColIndex: number,
): void {
	const { size, boxRows, boxCols } = sizeConfig;
	const numbers = shuffle(Array.from({ length: size }, (_, index) => index + 1));
	let numberIndex = 0;

	for (let row = 0; row < boxRows; row += 1) {
		for (let col = 0; col < boxCols; col += 1) {
			const absoluteRow = boxRowIndex * boxRows + row;
			const absoluteCol = boxColIndex * boxCols + col;
			board[getIndex(size, absoluteRow, absoluteCol)] = numbers[numberIndex]!;
			numberIndex += 1;
		}
	}
}

function fillDiagonalBoxes(board: number[], sizeConfig: SudokuSizeConfig): void {
	const boxRowsCount = sizeConfig.size / sizeConfig.boxRows;
	const boxColsCount = sizeConfig.size / sizeConfig.boxCols;
	const diagonalCount = Math.min(boxRowsCount, boxColsCount);

	for (let index = 0; index < diagonalCount; index += 1) {
		fillBox(board, sizeConfig, index, index);
	}
}

function findEmptyCell(board: number[], size: number): number {
	return board.findIndex((value) => value === 0);
}

function solveBoard(board: number[], sizeConfig: SudokuSizeConfig): boolean {
	const { size } = sizeConfig;
	const emptyIndex = findEmptyCell(board, size);
	if (emptyIndex === -1) {
		return true;
	}

	const { row, col } = getRowCol(size, emptyIndex);
	const candidates = shuffle(Array.from({ length: size }, (_, index) => index + 1));

	for (const candidate of candidates) {
		if (!isValidPlacement(board, sizeConfig, row, col, candidate)) {
			continue;
		}
		board[emptyIndex] = candidate;
		if (solveBoard(board, sizeConfig)) {
			return true;
		}
		board[emptyIndex] = 0;
	}

	return false;
}

export function generateSolution(sizeConfig: SudokuSizeConfig): number[] {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const board = Array.from({ length: sizeConfig.size * sizeConfig.size }, () => 0);
		fillDiagonalBoxes(board, sizeConfig);
		if (solveBoard(board, sizeConfig)) {
			return board;
		}
	}
	throw new Error('Failed to generate sudoku solution');
}

export function createPuzzle(
	solution: number[],
	sizeConfig: SudokuSizeConfig,
	clueCount: number,
): GeneratedPuzzle {
	const totalCells = sizeConfig.size * sizeConfig.size;
	const targetClues = Math.min(totalCells, Math.max(1, clueCount));
	const puzzle = [...solution];
	const givenMask = Array.from({ length: totalCells }, () => true);
	const indices = shuffle(Array.from({ length: totalCells }, (_, index) => index));

	let removed = 0;
	const removeTarget = totalCells - targetClues;
	for (const index of indices) {
		if (removed >= removeTarget) {
			break;
		}
		puzzle[index] = 0;
		givenMask[index] = false;
		removed += 1;
	}

	const givens = puzzle.map((value, index) => (givenMask[index] ? value : 0));
	return { solution, givens, givenMask };
}

export function generatePuzzle(config: SudokuGameConfig): GeneratedPuzzle {
	const solution = generateSolution(config.size);
	return createPuzzle(solution, config.size, config.clueCount);
}

export function hasConflict(
	values: number[],
	sizeConfig: SudokuSizeConfig,
	index: number,
): boolean {
	const value = values[index];
	if (value === 0) {
		return false;
	}

	const { size } = sizeConfig;
	const { row, col } = getRowCol(size, index);

	for (let c = 0; c < size; c += 1) {
		const cellIndex = getIndex(size, row, c);
		if (cellIndex !== index && values[cellIndex] === value) {
			return true;
		}
	}

	for (let r = 0; r < size; r += 1) {
		const cellIndex = getIndex(size, r, col);
		if (cellIndex !== index && values[cellIndex] === value) {
			return true;
		}
	}

	const { boxRows, boxCols } = sizeConfig;
	const boxRowStart = Math.floor(row / boxRows) * boxRows;
	const boxColStart = Math.floor(col / boxCols) * boxCols;
	for (let r = boxRowStart; r < boxRowStart + boxRows; r += 1) {
		for (let c = boxColStart; c < boxColStart + boxCols; c += 1) {
			const cellIndex = getIndex(size, r, c);
			if (cellIndex !== index && values[cellIndex] === value) {
				return true;
			}
		}
	}

	return false;
}

export function isBoardComplete(values: number[], solution: number[]): boolean {
	return values.every((value, index) => value !== 0 && value === solution[index]);
}

export function toggleNoteMask(notes: number, value: number): number {
	const bit = 1 << (value - 1);
	return notes ^ bit;
}

export function hasNote(notes: number, value: number): boolean {
	return (notes & (1 << (value - 1))) !== 0;
}

export function clearNoteFromCells(
	notes: number[],
	indices: number[],
	value: number,
): number[] {
	const next = notes.slice();
	const bit = ~(1 << (value - 1));
	for (const index of indices) {
		next[index] = (next[index] ?? 0) & bit;
	}
	return next;
}

export function getRelatedCellIndices(
	sizeConfig: SudokuSizeConfig,
	index: number,
): number[] {
	const { size, boxRows, boxCols } = sizeConfig;
	const { row, col } = getRowCol(size, index);
	const indices = new Set<number>();

	for (let c = 0; c < size; c += 1) {
		indices.add(getIndex(size, row, c));
	}
	for (let r = 0; r < size; r += 1) {
		indices.add(getIndex(size, r, col));
	}

	const boxRowStart = Math.floor(row / boxRows) * boxRows;
	const boxColStart = Math.floor(col / boxCols) * boxCols;
	for (let r = boxRowStart; r < boxRowStart + boxRows; r += 1) {
		for (let c = boxColStart; c < boxColStart + boxCols; c += 1) {
			indices.add(getIndex(size, r, c));
		}
	}

	indices.delete(index);
	return [...indices];
}

export function getNotePosition(value: number, noteCols: number): { row: number; col: number } {
	const index = value - 1;
	return { row: Math.floor(index / noteCols), col: index % noteCols };
}

export function getWindowSizeForBoard(size: number): { width: number; height: number } {
	const cellSize = size <= 4 ? 64 : size === 6 ? 48 : 40;
	const boardSize = size * cellSize + Math.ceil(size / Math.sqrt(size)) - 1;
	return {
		width: Math.max(320, boardSize + 48),
		height: Math.max(420, boardSize + 220),
	};
}

export { getIndex, getRowCol };
