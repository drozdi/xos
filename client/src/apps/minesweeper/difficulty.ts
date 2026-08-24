export interface MinesweeperDifficulty {
	id: string;
	label: string;
	rows: number;
	cols: number;
	mines: number;
}

export const DIFFICULTIES: MinesweeperDifficulty[] = [
	{ id: 'beginner', label: 'Новичок', rows: 9, cols: 9, mines: 10 },
	{ id: 'intermediate', label: 'Любитель', rows: 16, cols: 16, mines: 40 },
	{ id: 'expert', label: 'Профессионал', rows: 16, cols: 30, mines: 99 },
];

export const DEFAULT_DIFFICULTY = DIFFICULTIES[0]!;

export function getDifficulty(id: string): MinesweeperDifficulty | undefined {
	return DIFFICULTIES.find((item) => item.id === id);
}

export function getWindowSizeForBoard(difficulty: MinesweeperDifficulty): {
	width: number;
	height: number;
} {
	const cell = difficulty.cols >= 30 ? 22 : difficulty.cols >= 16 ? 26 : 32;
	return {
		width: Math.max(360, difficulty.cols * cell + 48),
		height: Math.max(420, difficulty.rows * cell + 160),
	};
}
