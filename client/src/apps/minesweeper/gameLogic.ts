export type CellState = 'hidden' | 'open' | 'flagged';

export interface Cell {
	mine: boolean;
	adjacent: number;
	state: CellState;
}

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export function createEmptyBoard(rows: number, cols: number): Cell[] {
	return Array.from({ length: rows * cols }, () => ({
		mine: false,
		adjacent: 0,
		state: 'hidden' as CellState,
	}));
}

export function indexOf(row: number, col: number, cols: number): number {
	return row * cols + col;
}

export function neighbors(row: number, col: number, rows: number, cols: number): Array<[number, number]> {
	const result: Array<[number, number]> = [];
	for (let dr = -1; dr <= 1; dr += 1) {
		for (let dc = -1; dc <= 1; dc += 1) {
			if (dr === 0 && dc === 0) {
				continue;
			}
			const nr = row + dr;
			const nc = col + dc;
			if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
				result.push([nr, nc]);
			}
		}
	}
	return result;
}

/** Place mines after first click so the first cell (and preferably its neighborhood) is safe. */
export function placeMines(
	board: Cell[],
	rows: number,
	cols: number,
	mines: number,
	safeIndex: number,
): Cell[] {
	const next = board.map((cell) => ({ ...cell, mine: false, adjacent: 0 }));
	const safe = new Set<number>([safeIndex]);
	const safeRow = Math.floor(safeIndex / cols);
	const safeCol = safeIndex % cols;
	for (const [nr, nc] of neighbors(safeRow, safeCol, rows, cols)) {
		safe.add(indexOf(nr, nc, cols));
	}

	const candidates: number[] = [];
	for (let i = 0; i < next.length; i += 1) {
		if (!safe.has(i)) {
			candidates.push(i);
		}
	}

	for (let i = candidates.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = candidates[i]!;
		candidates[i] = candidates[j]!;
		candidates[j] = tmp;
	}

	const mineCount = Math.min(mines, candidates.length);
	for (let i = 0; i < mineCount; i += 1) {
		next[candidates[i]!]!.mine = true;
	}

	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			const i = indexOf(row, col, cols);
			if (next[i]!.mine) {
				continue;
			}
			let count = 0;
			for (const [nr, nc] of neighbors(row, col, rows, cols)) {
				if (next[indexOf(nr, nc, cols)]!.mine) {
					count += 1;
				}
			}
			next[i]!.adjacent = count;
		}
	}

	return next;
}

export function revealFlood(board: Cell[], rows: number, cols: number, startIndex: number): Cell[] {
	const next = board.map((cell) => ({ ...cell }));
	const start = next[startIndex];
	if (!start || start.state === 'flagged' || start.state === 'open') {
		return next;
	}
	if (start.mine) {
		start.state = 'open';
		return next;
	}

	const queue = [startIndex];
	const visited = new Set<number>();

	while (queue.length > 0) {
		const index = queue.pop()!;
		if (visited.has(index)) {
			continue;
		}
		visited.add(index);
		const cell = next[index]!;
		if (cell.state === 'flagged') {
			continue;
		}
		cell.state = 'open';
		if (cell.adjacent !== 0 || cell.mine) {
			continue;
		}
		const row = Math.floor(index / cols);
		const col = index % cols;
		for (const [nr, nc] of neighbors(row, col, rows, cols)) {
			const ni = indexOf(nr, nc, cols);
			if (!visited.has(ni) && next[ni]!.state !== 'open') {
				queue.push(ni);
			}
		}
	}

	return next;
}

export function toggleFlag(board: Cell[], index: number): Cell[] {
	const next = board.map((cell) => ({ ...cell }));
	const cell = next[index];
	if (!cell || cell.state === 'open') {
		return next;
	}
	cell.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
	return next;
}

export function chordReveal(
	board: Cell[],
	rows: number,
	cols: number,
	index: number,
): { board: Cell[]; hitMine: boolean } {
	const cell = board[index];
	if (!cell || cell.state !== 'open' || cell.adjacent === 0) {
		return { board, hitMine: false };
	}

	const row = Math.floor(index / cols);
	const col = index % cols;
	const around = neighbors(row, col, rows, cols);
	const flags = around.filter(([nr, nc]) => board[indexOf(nr, nc, cols)]!.state === 'flagged').length;
	if (flags !== cell.adjacent) {
		return { board, hitMine: false };
	}

	let next = board.map((item) => ({ ...item }));
	let hitMine = false;
	for (const [nr, nc] of around) {
		const ni = indexOf(nr, nc, cols);
		const neighbor = next[ni]!;
		if (neighbor.state !== 'hidden') {
			continue;
		}
		if (neighbor.mine) {
			hitMine = true;
			neighbor.state = 'open';
			continue;
		}
		next = revealFlood(next, rows, cols, ni);
	}

	return { board: next, hitMine };
}

export function revealAllMines(board: Cell[]): Cell[] {
	return board.map((cell) =>
		cell.mine ? { ...cell, state: 'open' as CellState } : { ...cell },
	);
}

export function countFlags(board: Cell[]): number {
	return board.reduce((sum, cell) => sum + (cell.state === 'flagged' ? 1 : 0), 0);
}

export function checkWin(board: Cell[]): boolean {
	return board.every((cell) => (cell.mine ? cell.state !== 'open' : cell.state === 'open'));
}
