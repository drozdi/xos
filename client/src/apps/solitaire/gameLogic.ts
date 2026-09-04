import { type Card, createDeck, isRed, shuffle } from './deck';

export type DrawMode = 1 | 3;

export interface SolitaireState {
	tableau: Card[][];
	foundations: Card[][];
	stock: Card[];
	waste: Card[];
	drawMode: DrawMode;
}

export type PileRef =
	| { type: 'tableau'; col: number; index: number }
	| { type: 'waste' }
	| { type: 'foundation'; index: number };

export function dealKlondike(drawMode: DrawMode = 3): SolitaireState {
	const deck = shuffle(createDeck());
	const tableau: Card[][] = Array.from({ length: 7 }, () => []);
	let cursor = 0;
	for (let col = 0; col < 7; col += 1) {
		for (let row = 0; row <= col; row += 1) {
			const card = { ...deck[cursor++]!, faceUp: row === col };
			tableau[col]!.push(card);
		}
	}
	const stock = deck.slice(cursor).map((card) => ({ ...card, faceUp: false }));
	return {
		tableau,
		foundations: [[], [], [], []],
		stock,
		waste: [],
		drawMode,
	};
}

export function cloneState(state: SolitaireState): SolitaireState {
	return {
		drawMode: state.drawMode,
		stock: state.stock.map((c) => ({ ...c })),
		waste: state.waste.map((c) => ({ ...c })),
		foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
		tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
	};
}

export function canStackOnTableau(moving: Card, target: Card | undefined): boolean {
	if (!target) {
		return moving.rank === 13;
	}
	return moving.rank === target.rank - 1 && isRed(moving.suit) !== isRed(target.suit);
}

export function canStackOnFoundation(moving: Card, pile: Card[]): boolean {
	if (pile.length === 0) {
		return moving.rank === 1;
	}
	const top = pile[pile.length - 1]!;
	return moving.suit === top.suit && moving.rank === top.rank + 1;
}

export function getTableauRun(column: Card[], fromIndex: number): Card[] | null {
	if (fromIndex < 0 || fromIndex >= column.length) {
		return null;
	}
	if (!column[fromIndex]!.faceUp) {
		return null;
	}
	const run = column.slice(fromIndex);
	for (let i = 0; i < run.length - 1; i += 1) {
		const a = run[i]!;
		const b = run[i + 1]!;
		if (a.rank !== b.rank + 1 || isRed(a.suit) === isRed(b.suit)) {
			return null;
		}
	}
	return run;
}

function flipTop(column: Card[]): void {
	if (column.length === 0) {
		return;
	}
	const top = column[column.length - 1]!;
	if (!top.faceUp) {
		top.faceUp = true;
	}
}

export function drawFromStock(state: SolitaireState): SolitaireState {
	const next = cloneState(state);
	if (next.stock.length === 0) {
		next.stock = next.waste
			.slice()
			.reverse()
			.map((card) => ({ ...card, faceUp: false }));
		next.waste = [];
		return next;
	}
	const count = Math.min(next.drawMode, next.stock.length);
	for (let i = 0; i < count; i += 1) {
		const card = next.stock.pop()!;
		card.faceUp = true;
		next.waste.push(card);
	}
	return next;
}

export function moveCards(
	state: SolitaireState,
	from: PileRef,
	to: { type: 'tableau'; col: number } | { type: 'foundation'; index: number },
): SolitaireState | null {
	const next = cloneState(state);
	let moving: Card[] = [];

	if (from.type === 'waste') {
		if (next.waste.length === 0) {
			return null;
		}
		moving = [next.waste[next.waste.length - 1]!];
	} else if (from.type === 'foundation') {
		const pile = next.foundations[from.index]!;
		if (pile.length === 0) {
			return null;
		}
		moving = [pile[pile.length - 1]!];
	} else {
		const column = next.tableau[from.col]!;
		const run = getTableauRun(column, from.index);
		if (!run) {
			return null;
		}
		moving = run;
	}

	if (to.type === 'foundation') {
		if (moving.length !== 1) {
			return null;
		}
		const pile = next.foundations[to.index]!;
		if (!canStackOnFoundation(moving[0]!, pile)) {
			return null;
		}
	} else {
		const targetCol = next.tableau[to.col]!;
		const targetTop = targetCol[targetCol.length - 1];
		if (!canStackOnTableau(moving[0]!, targetTop)) {
			return null;
		}
	}

	if (from.type === 'waste') {
		next.waste.pop();
	} else if (from.type === 'foundation') {
		next.foundations[from.index]!.pop();
	} else {
		next.tableau[from.col] = next.tableau[from.col]!.slice(0, from.index);
		flipTop(next.tableau[from.col]!);
	}

	if (to.type === 'foundation') {
		next.foundations[to.index]!.push({ ...moving[0]!, faceUp: true });
	} else {
		next.tableau[to.col]!.push(...moving.map((card) => ({ ...card, faceUp: true })));
	}

	return next;
}

export function tryAutoFoundation(state: SolitaireState, from: PileRef): SolitaireState | null {
	let card: Card | undefined;
	if (from.type === 'waste') {
		card = state.waste[state.waste.length - 1];
	} else if (from.type === 'tableau') {
		const col = state.tableau[from.col]!;
		if (from.index !== col.length - 1) {
			return null;
		}
		card = col[from.index];
	} else {
		return null;
	}
	if (!card?.faceUp) {
		return null;
	}
	for (let i = 0; i < 4; i += 1) {
		const moved = moveCards(state, from, { type: 'foundation', index: i });
		if (moved) {
			return moved;
		}
	}
	return null;
}

export function tryAutoTableau(state: SolitaireState, from: PileRef): SolitaireState | null {
	for (let col = 0; col < state.tableau.length; col += 1) {
		if (from.type === 'tableau' && from.col === col) {
			continue;
		}
		const moved = moveCards(state, from, { type: 'tableau', col });
		if (moved) {
			return moved;
		}
	}
	return null;
}

/** Foundation first, then another tableau column. */
export function tryAutoPlace(state: SolitaireState, from: PileRef): SolitaireState | null {
	return tryAutoFoundation(state, from) ?? tryAutoTableau(state, from);
}

export function autoMoveAllToFoundations(state: SolitaireState): SolitaireState | null {
	let current = state;
	let movedAny = false;
	let changed = true;

	while (changed) {
		changed = false;
		const fromWaste = tryAutoFoundation(current, { type: 'waste' });
		if (fromWaste) {
			current = fromWaste;
			movedAny = true;
			changed = true;
			continue;
		}
		for (let col = 0; col < current.tableau.length; col += 1) {
			const column = current.tableau[col]!;
			if (column.length === 0) {
				continue;
			}
			const moved = tryAutoFoundation(current, {
				type: 'tableau',
				col,
				index: column.length - 1,
			});
			if (moved) {
				current = moved;
				movedAny = true;
				changed = true;
				break;
			}
		}
	}

	return movedAny ? current : null;
}

export function isWon(state: SolitaireState): boolean {
	return state.foundations.every((pile) => pile.length === 13);
}
