import type { SudokuSizeConfig } from './difficulty';
import {
	clearNoteFromCells,
	getRelatedCellIndices,
	isBoardComplete,
	toggleNoteMask,
	type InputMode,
} from './gameLogic';

export interface SudokuInputState {
	givenMask: boolean[];
	values: number[];
	notes: number[];
	selectedIndex: number | null;
	selectedNumber: number | null;
	inputMode: InputMode;
}

export interface SudokuInputPatch {
	values?: number[];
	notes?: number[];
	selectedIndex?: number | null;
	selectedNumber?: number | null;
	isComplete?: boolean;
}

export interface SudokuInputContext {
	sizeConfig: SudokuSizeConfig;
	solution: number[];
}

function isEditableCell(givenMask: boolean[], index: number): boolean {
	return !givenMask[index];
}

function applyPenValue(
	state: SudokuInputState,
	context: SudokuInputContext,
	index: number,
	value: number,
): SudokuInputPatch {
	if (!isEditableCell(state.givenMask, index)) {
		return {};
	}

	const nextValues = state.values.slice();
	nextValues[index] = nextValues[index] === value ? 0 : value;

	let nextNotes = state.notes.slice();
	nextNotes[index] = 0;
	if (nextValues[index] !== 0) {
		const related = getRelatedCellIndices(context.sizeConfig, index);
		nextNotes = clearNoteFromCells(nextNotes, related, value);
	}

	return {
		values: nextValues,
		notes: nextNotes,
		isComplete: isBoardComplete(nextValues, context.solution),
	};
}

export function handleCellClickInput(
	state: SudokuInputState,
	context: SudokuInputContext,
	index: number,
): SudokuInputPatch {
	if (!isEditableCell(state.givenMask, index)) {
		return { selectedIndex: index };
	}

	if (state.inputMode === 'pencil') {
		if (state.selectedNumber !== null && state.values[index] === 0) {
			const nextNotes = state.notes.slice();
			nextNotes[index] = toggleNoteMask(state.notes[index] ?? 0, state.selectedNumber);
			return { notes: nextNotes, selectedIndex: index };
		}
		return { selectedIndex: index };
	}

	if (state.selectedNumber !== null) {
		return {
			selectedIndex: index,
			...applyPenValue(state, context, index, state.selectedNumber),
		};
	}

	return { selectedIndex: index };
}

export function selectNumberInput(
	state: SudokuInputState,
	context: SudokuInputContext,
	value: number,
): SudokuInputPatch {
	if (state.inputMode === 'pencil') {
		if (state.selectedNumber !== null) {
			return { selectedNumber: state.selectedNumber === value ? null : value };
		}

		const canEditNotesInCell =
			state.selectedIndex !== null &&
			isEditableCell(state.givenMask, state.selectedIndex) &&
			state.values[state.selectedIndex] === 0;

		if (canEditNotesInCell) {
			const cellIndex = state.selectedIndex!;
			const nextNotes = state.notes.slice();
			nextNotes[cellIndex] = toggleNoteMask(state.notes[cellIndex] ?? 0, value);
			return { notes: nextNotes };
		}

		return { selectedNumber: value };
	}

	if (
		state.selectedIndex !== null &&
		isEditableCell(state.givenMask, state.selectedIndex)
	) {
		return applyPenValue(state, context, state.selectedIndex, value);
	}

	return { selectedNumber: state.selectedNumber === value ? null : value };
}

export function clearCellInput(state: SudokuInputState): SudokuInputPatch {
	if (
		state.selectedIndex === null ||
		!isEditableCell(state.givenMask, state.selectedIndex)
	) {
		return {};
	}

	const nextValues = state.values.slice();
	nextValues[state.selectedIndex] = 0;
	const nextNotes = state.notes.slice();
	nextNotes[state.selectedIndex] = 0;
	return { values: nextValues, notes: nextNotes, isComplete: false };
}

export function clearCellSelectionInput(): SudokuInputPatch {
	return { selectedIndex: null };
}

export function toggleCellNoteInput(
	state: SudokuInputState,
	index: number,
	value: number,
): SudokuInputPatch {
	if (!isEditableCell(state.givenMask, index) || state.values[index] !== 0) {
		return { selectedIndex: index };
	}

	const nextNotes = state.notes.slice();
	nextNotes[index] = toggleNoteMask(state.notes[index] ?? 0, value);
	return { notes: nextNotes, selectedIndex: index };
}
