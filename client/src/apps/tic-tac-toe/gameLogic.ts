export type Player = 'X' | 'O';
export type CellValue = Player | '';

export const WIN_COMBINATIONS: ReadonlyArray<readonly [number, number, number]> = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

export type GameResult =
	| { status: 'playing' }
	| { status: 'win'; player: Player }
	| { status: 'draw' };

export function checkGameResult(field: CellValue[]): GameResult {
	for (const [a, b, c] of WIN_COMBINATIONS) {
		const winner = field[a];
		if (winner && winner === field[b] && winner === field[c]) {
			return { status: 'win', player: winner };
		}
	}

	if (field.every((cell) => cell !== '')) {
		return { status: 'draw' };
	}

	return { status: 'playing' };
}

export function createEmptyField(): CellValue[] {
	return Array.from({ length: 9 }, () => '');
}
