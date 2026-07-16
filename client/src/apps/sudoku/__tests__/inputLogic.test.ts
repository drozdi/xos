import { describe, expect, it } from 'vitest';

import { buildGameConfig } from '../difficulty';
import {
	clearCellInput,
	clearCellSelectionInput,
	handleCellClickInput,
	selectNumberInput,
	toggleCellNoteInput,
	type SudokuInputState,
} from '../inputLogic';

const config = buildGameConfig('9x9', 'easy')!;

function createState(overrides: Partial<SudokuInputState> = {}): SudokuInputState {
	const total = 81;
	return {
		givenMask: Array.from({ length: total }, (_, index) => index === 0),
		values: Array.from({ length: total }, () => 0),
		notes: Array.from({ length: total }, () => 0),
		selectedIndex: null,
		selectedNumber: null,
		inputMode: 'pen',
		...overrides,
	};
}

const context = {
	sizeConfig: config.size,
	solution: Array.from({ length: 81 }, () => 1),
};

describe('sudoku inputLogic', () => {
	it('pencil: selects number on toolbar when no cell is selected', () => {
		const patch = selectNumberInput(
			createState({ inputMode: 'pencil' }),
			context,
			5,
		);
		expect(patch.selectedNumber).toBe(5);
	});

	it('pencil: toggles note in selected cell when number is not selected', () => {
		const state = createState({ inputMode: 'pencil', selectedIndex: 10 });
		const patch = selectNumberInput(state, context, 3);
		expect(patch.notes?.[10]).toBe(1 << 2);
	});

	it('pencil: toggles note in clicked cell when number is selected', () => {
		const state = createState({ inputMode: 'pencil', selectedNumber: 4 });
		const patch = handleCellClickInput(state, context, 10);
		expect(patch.notes?.[10]).toBe(1 << 3);
		expect(patch.selectedIndex).toBe(10);
	});

	it('pen: places value in selected cell from toolbar', () => {
		const state = createState({ selectedIndex: 10 });
		const patch = selectNumberInput(state, context, 7);
		expect(patch.values?.[10]).toBe(7);
	});

	it('pen: places selected number in clicked cell', () => {
		const state = createState({ selectedNumber: 8 });
		const patch = handleCellClickInput(state, context, 10);
		expect(patch.values?.[10]).toBe(8);
		expect(patch.selectedIndex).toBe(10);
	});

	it('pen: clears related pencil notes after placement', () => {
		const notes = Array.from({ length: 81 }, () => 0);
		notes[11] = 1 << 4;
		const state = createState({ selectedIndex: 10, notes });
		const patch = selectNumberInput(state, context, 5);
		expect(patch.values?.[10]).toBe(5);
		expect(patch.notes?.[11]).toBe(0);
	});

	it('does not edit given cells', () => {
		const state = createState({ selectedIndex: 0, selectedNumber: 2 });
		const patch = handleCellClickInput(state, context, 0);
		expect(patch.values).toBeUndefined();
		expect(patch.selectedIndex).toBe(0);
	});

	it('clearCell removes value and notes', () => {
		const values = Array.from({ length: 81 }, () => 0);
		values[10] = 5;
		const notes = Array.from({ length: 81 }, () => 0);
		notes[10] = 1 << 2;
		const patch = clearCellInput(createState({ selectedIndex: 10, values, notes }));
		expect(patch.values?.[10]).toBe(0);
		expect(patch.notes?.[10]).toBe(0);
	});

	it('clearCellSelection clears selected cell only', () => {
		expect(clearCellSelectionInput()).toEqual({ selectedIndex: null });
	});

	it('toggleCellNote removes note on second toggle', () => {
		const notes = Array.from({ length: 81 }, () => 0);
		notes[10] = 1 << 2;
		const state = createState({ inputMode: 'pencil', notes });
		const patch = toggleCellNoteInput(state, 10, 3);
		expect(patch.notes?.[10]).toBe(0);
	});
});
