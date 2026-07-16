export interface Difficulty {
	id: string;
	label: string;
	/** Размер поля N×N */
	size: number;
	/** Сколько фигур подряд нужно для победы */
	winLength: number;
}

export const DIFFICULTIES: Difficulty[] = [
	{ id: 'easy', label: 'Лёгкая', size: 3, winLength: 3 },
	{ id: 'medium', label: 'Средняя', size: 4, winLength: 4 },
	{ id: 'hard', label: 'Сложная', size: 5, winLength: 4 },
];

export const DEFAULT_DIFFICULTY = DIFFICULTIES[0]!;

export function findDifficulty(id: string): Difficulty | undefined {
	return DIFFICULTIES.find((item) => item.id === id);
}
