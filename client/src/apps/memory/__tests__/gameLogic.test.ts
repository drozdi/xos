import { describe, expect, it } from 'vitest';

import { allMatched, createDeck, MEMORY_SYMBOLS } from '../gameLogic';

describe('memory logic', () => {
	it('creates 16 cards with 8 pairs', () => {
		const deck = createDeck(() => 0.2);
		expect(deck).toHaveLength(MEMORY_SYMBOLS.length * 2);
		for (const symbol of MEMORY_SYMBOLS) {
			expect(deck.filter((c) => c.symbol === symbol)).toHaveLength(2);
		}
	});

	it('detects all matched', () => {
		const cards = createDeck().map((c) => ({ ...c, matched: true }));
		expect(allMatched(cards)).toBe(true);
	});
});
