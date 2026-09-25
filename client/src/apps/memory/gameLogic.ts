export const MEMORY_SYMBOLS = ['🍎', '🍋', '🍇', '🍉', '🍒', '🥝', '🍑', '🍓'] as const;

export type MemoryCard = {
	id: number;
	symbol: string;
	flipped: boolean;
	matched: boolean;
};

export function shuffle<T>(items: T[], random = Math.random): T[] {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[next[i], next[j]] = [next[j]!, next[i]!];
	}
	return next;
}

export function createDeck(random = Math.random): MemoryCard[] {
	const pairs = MEMORY_SYMBOLS.flatMap((symbol, index) => [
		{ id: index * 2, symbol, flipped: false, matched: false },
		{ id: index * 2 + 1, symbol, flipped: false, matched: false },
	]);
	return shuffle(pairs, random);
}

export function allMatched(cards: MemoryCard[]): boolean {
	return cards.every((card) => card.matched);
}
