export type Player = 'X' | 'O';
export type CellValue = Player | '';

export type GameResult =
	| { status: 'playing' }
	| { status: 'win'; player: Player }
	| { status: 'draw' };

export function createEmptyField(size: number): CellValue[] {
	return Array.from({ length: size * size }, () => '');
}

/** Все линии длины winLength на поле size×size */
export function generateWinLines(size: number, winLength: number): number[][] {
	const lines: number[][] = [];

	for (let row = 0; row < size; row++) {
		for (let col = 0; col <= size - winLength; col++) {
			const line: number[] = [];
			for (let offset = 0; offset < winLength; offset++) {
				line.push(row * size + col + offset);
			}
			lines.push(line);
		}
	}

	for (let col = 0; col < size; col++) {
		for (let row = 0; row <= size - winLength; row++) {
			const line: number[] = [];
			for (let offset = 0; offset < winLength; offset++) {
				line.push((row + offset) * size + col);
			}
			lines.push(line);
		}
	}

	for (let row = 0; row <= size - winLength; row++) {
		for (let col = 0; col <= size - winLength; col++) {
			const line: number[] = [];
			for (let offset = 0; offset < winLength; offset++) {
				line.push((row + offset) * size + col + offset);
			}
			lines.push(line);
		}
	}

	for (let row = 0; row <= size - winLength; row++) {
		for (let col = winLength - 1; col < size; col++) {
			const line: number[] = [];
			for (let offset = 0; offset < winLength; offset++) {
				line.push((row + offset) * size + col - offset);
			}
			lines.push(line);
		}
	}

	return lines;
}

export function checkGameResult(
	field: CellValue[],
	winLines: number[][],
): GameResult {
	for (const line of winLines) {
		const first = field[line[0]!];
		if (!first) {
			continue;
		}
		if (line.every((index) => field[index] === first)) {
			return { status: 'win', player: first };
		}
	}

	if (field.every((cell) => cell !== '')) {
		return { status: 'draw' };
	}

	return { status: 'playing' };
}
