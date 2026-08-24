import { describe, expect, it } from 'vitest';

import {
	canStackOnFoundation,
	canStackOnTableau,
	dealKlondike,
	drawFromStock,
	getTableauRun,
	isWon,
	moveCards,
} from '../gameLogic';

describe('solitaire gameLogic', () => {
	it('deals 52 cards into tableau and stock', () => {
		const state = dealKlondike(3);
		const tableauCount = state.tableau.reduce((sum, col) => sum + col.length, 0);
		expect(tableauCount).toBe(28);
		expect(state.stock.length).toBe(24);
		expect(state.tableau[0]).toHaveLength(1);
		expect(state.tableau[6]).toHaveLength(7);
		expect(state.tableau[6]![6]!.faceUp).toBe(true);
	});

	it('validates tableau and foundation stacking', () => {
		expect(
			canStackOnTableau(
				{ id: 'a', suit: 'hearts', rank: 12, faceUp: true },
				{ id: 'b', suit: 'spades', rank: 13, faceUp: true },
			),
		).toBe(true);
		expect(
			canStackOnTableau(
				{ id: 'a', suit: 'hearts', rank: 12, faceUp: true },
				{ id: 'b', suit: 'diamonds', rank: 13, faceUp: true },
			),
		).toBe(false);
		expect(canStackOnFoundation({ id: 'a', suit: 'clubs', rank: 1, faceUp: true }, [])).toBe(true);
		expect(
			canStackOnFoundation(
				{ id: 'a', suit: 'clubs', rank: 2, faceUp: true },
				[{ id: 'b', suit: 'clubs', rank: 1, faceUp: true }],
			),
		).toBe(true);
	});

	it('draws from stock and recycles waste', () => {
		let state = dealKlondike(3);
		const before = state.stock.length;
		state = drawFromStock(state);
		expect(state.waste.length).toBe(Math.min(3, before));
		expect(state.stock.length).toBe(before - state.waste.length);
	});

	it('moves waste card onto valid tableau', () => {
		let state = dealKlondike(1);
		state = {
			...state,
			waste: [{ id: 'qh', suit: 'hearts', rank: 12, faceUp: true }],
			tableau: state.tableau.map((col, index) =>
				index === 0 ? [{ id: 'ks', suit: 'spades', rank: 13, faceUp: true }] : col,
			),
		};
		const moved = moveCards(state, { type: 'waste' }, { type: 'tableau', col: 0 });
		expect(moved).not.toBeNull();
		expect(moved!.tableau[0]).toHaveLength(2);
		expect(moved!.waste).toHaveLength(0);
	});

	it('detects win when foundations full', () => {
		const state = dealKlondike(3);
		expect(isWon(state)).toBe(false);
		const full = {
			...state,
			foundations: state.foundations.map((_, i) =>
				Array.from({ length: 13 }, (__, rank) => ({
					id: `${i}-${rank}`,
					suit: (['spades', 'hearts', 'diamonds', 'clubs'] as const)[i]!,
					rank: (rank + 1) as 1,
					faceUp: true,
				})),
			),
		};
		expect(isWon(full)).toBe(true);
	});

	it('rejects invalid tableau run', () => {
		const column = [
			{ id: '1', suit: 'spades' as const, rank: 5 as const, faceUp: true },
			{ id: '2', suit: 'spades' as const, rank: 4 as const, faceUp: true },
		];
		expect(getTableauRun(column, 0)).toBeNull();
	});
});
