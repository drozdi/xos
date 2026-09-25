export type Direction = 'up' | 'down' | 'left' | 'right';
export type Board = number[][];

export const SIZE = 4;
const BEST_KEY = 'xos.game-2048.best';

export function emptyBoard(): Board {
	return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

export function cloneBoard(board: Board): Board {
	return board.map((row) => [...row]);
}

export function boardsEqual(a: Board, b: Board): boolean {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (a[r]![c] !== b[r]![c]) {
				return false;
			}
		}
	}
	return true;
}

function emptyCells(board: Board): Array<{ r: number; c: number }> {
	const cells: Array<{ r: number; c: number }> = [];
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (board[r]![c] === 0) {
				cells.push({ r, c });
			}
		}
	}
	return cells;
}

export function spawnTile(board: Board, random = Math.random): Board {
	const cells = emptyCells(board);
	if (cells.length === 0) {
		return board;
	}
	const next = cloneBoard(board);
	const pick = cells[Math.floor(random() * cells.length)]!;
	next[pick.r]![pick.c] = random() < 0.9 ? 2 : 4;
	return next;
}

export function createInitialBoard(random = Math.random): Board {
	return spawnTile(spawnTile(emptyBoard(), random), random);
}

function slideLine(line: number[]): { line: number[]; gained: number } {
	const filtered = line.filter((v) => v !== 0);
	const result: number[] = [];
	let gained = 0;
	let i = 0;
	while (i < filtered.length) {
		const cur = filtered[i]!;
		if (i + 1 < filtered.length && filtered[i + 1] === cur) {
			const merged = cur * 2;
			result.push(merged);
			gained += merged;
			i += 2;
		} else {
			result.push(cur);
			i += 1;
		}
	}
	while (result.length < SIZE) {
		result.push(0);
	}
	return { line: result, gained };
}

function transpose(board: Board): Board {
	const next = emptyBoard();
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			next[c]![r] = board[r]![c]!;
		}
	}
	return next;
}

export function moveBoard(board: Board, direction: Direction): { board: Board; gained: number; moved: boolean } {
	let working = cloneBoard(board);
	let gained = 0;

	const reverseRows = direction === 'right' || direction === 'down';
	const useTranspose = direction === 'up' || direction === 'down';

	if (useTranspose) {
		working = transpose(working);
	}

	for (let r = 0; r < SIZE; r++) {
		let row = working[r]!;
		if (reverseRows) {
			row = [...row].reverse();
		}
		const slid = slideLine(row);
		gained += slid.gained;
		working[r] = reverseRows ? [...slid.line].reverse() : slid.line;
	}

	if (useTranspose) {
		working = transpose(working);
	}

	return {
		board: working,
		gained,
		moved: !boardsEqual(board, working),
	};
}

export function canMove(board: Board): boolean {
	if (emptyCells(board).length > 0) {
		return true;
	}
	for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
		if (moveBoard(board, dir).moved) {
			return true;
		}
	}
	return false;
}

export function has2048(board: Board): boolean {
	return board.some((row) => row.some((v) => v >= 2048));
}

export function readBestScore(): number {
	try {
		const raw = localStorage.getItem(BEST_KEY);
		const n = raw ? Number.parseInt(raw, 10) : 0;
		return Number.isFinite(n) && n > 0 ? n : 0;
	} catch {
		return 0;
	}
}

export function writeBestScore(score: number): void {
	try {
		localStorage.setItem(BEST_KEY, String(score));
	} catch {
		/* ignore */
	}
}
