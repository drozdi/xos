export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
	id: string;
	suit: Suit;
	rank: Rank;
	faceUp: boolean;
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function isRed(suit: Suit): boolean {
	return suit === 'hearts' || suit === 'diamonds';
}

export function suitSymbol(suit: Suit): string {
	switch (suit) {
		case 'spades':
			return '♠';
		case 'hearts':
			return '♥';
		case 'diamonds':
			return '♦';
		case 'clubs':
			return '♣';
	}
}

export function rankLabel(rank: Rank): string {
	switch (rank) {
		case 1:
			return 'A';
		case 11:
			return 'J';
		case 12:
			return 'Q';
		case 13:
			return 'K';
		default:
			return String(rank);
	}
}

export function createDeck(): Card[] {
	const deck: Card[] = [];
	for (const suit of SUITS) {
		for (const rank of RANKS) {
			deck.push({
				id: `${suit}-${rank}`,
				suit,
				rank,
				faceUp: false,
			});
		}
	}
	return deck;
}

export function shuffle<T>(items: T[]): T[] {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = next[i]!;
		next[i] = next[j]!;
		next[j] = tmp;
	}
	return next;
}
