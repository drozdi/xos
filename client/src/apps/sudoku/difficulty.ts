export interface SudokuSizeConfig {
	id: string;
	label: string;
	size: number;
	boxRows: number;
	boxCols: number;
}

export interface SudokuDifficulty {
	id: string;
	label: string;
}

export interface SudokuGameConfig {
	size: SudokuSizeConfig;
	difficulty: SudokuDifficulty;
	clueCount: number;
}

export const SUDOKU_SIZES: SudokuSizeConfig[] = [
	{ id: '4x4', label: '4×4', size: 4, boxRows: 2, boxCols: 2 },
	{ id: '6x6', label: '6×6', size: 6, boxRows: 2, boxCols: 3 },
	{ id: '9x9', label: '9×9', size: 9, boxRows: 3, boxCols: 3 },
];

export const SUDOKU_DIFFICULTIES: SudokuDifficulty[] = [
	{ id: 'easy', label: 'Лёгкая' },
	{ id: 'medium', label: 'Средняя' },
	{ id: 'hard', label: 'Сложная' },
];

/** Число заранее заполненных клеток для пары размер + сложность */
const CLUE_COUNTS: Record<string, Record<string, number>> = {
	'4x4': { easy: 10, medium: 8, hard: 6 },
	'6x6': { easy: 24, medium: 18, hard: 14 },
	'9x9': { easy: 42, medium: 32, hard: 24 },
};

export const DEFAULT_SIZE = SUDOKU_SIZES[2]!;
export const DEFAULT_DIFFICULTY = SUDOKU_DIFFICULTIES[0]!;

export function getClueCount(sizeId: string, difficultyId: string): number {
	return CLUE_COUNTS[sizeId]?.[difficultyId] ?? 30;
}

export function findSize(id: string): SudokuSizeConfig | undefined {
	return SUDOKU_SIZES.find((item) => item.id === id);
}

export function buildGameConfig(sizeId: string, difficultyId: string): SudokuGameConfig | null {
	const size = findSize(sizeId);
	const difficulty = SUDOKU_DIFFICULTIES.find((item) => item.id === difficultyId);
	if (!size || !difficulty) {
		return null;
	}
	return {
		size,
		difficulty,
		clueCount: getClueCount(sizeId, difficultyId),
	};
}

export function getNoteGrid(sizeConfig: SudokuSizeConfig): { cols: number; rows: number } {
	return { cols: sizeConfig.boxCols, rows: sizeConfig.boxRows };
}
