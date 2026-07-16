import { create } from 'zustand';

import { useChildWindowStore } from '@/core/windowManager/childWindowStore';

import type { SudokuGameConfig } from './difficulty';
import { DEFAULT_DIFFICULTY, DEFAULT_SIZE, buildGameConfig } from './difficulty';
import { generatePuzzle, type InputMode } from './gameLogic';
import {
	clearCellInput,
	clearCellSelectionInput,
	handleCellClickInput,
	selectNumberInput,
	toggleCellNoteInput,
} from './inputLogic';

interface SudokuState {
	config: SudokuGameConfig;
	solution: number[];
	givenMask: boolean[];
	values: number[];
	notes: number[];
	selectedIndex: number | null;
	selectedNumber: number | null;
	inputMode: InputMode;
	isComplete: boolean;
	activeDialogId: string | null;
	handleCellClick: (index: number) => void;
	selectNumber: (value: number) => void;
	toggleCellNote: (index: number, value: number) => void;
	clearCellSelection: () => void;
	setInputMode: (mode: InputMode) => void;
	clearCell: () => void;
	startGame: (config: SudokuGameConfig) => void;
	setActiveDialogId: (id: string | null) => void;
	closeActiveDialog: (parentWindowId: string) => void;
}

function createInitialConfig(): SudokuGameConfig {
	return buildGameConfig(DEFAULT_SIZE.id, DEFAULT_DIFFICULTY.id)!;
}

function createGameState(config: SudokuGameConfig = createInitialConfig()) {
	const puzzle = generatePuzzle(config);
	return {
		config,
		solution: puzzle.solution,
		givenMask: puzzle.givenMask,
		values: [...puzzle.givens],
		notes: Array.from({ length: config.size.size * config.size.size }, () => 0),
		selectedIndex: null,
		selectedNumber: null,
		inputMode: 'pen' as InputMode,
		isComplete: false,
		activeDialogId: null,
	};
}

function getInputContext(state: SudokuState) {
	return {
		sizeConfig: state.config.size,
		solution: state.solution,
	};
}

function getInputState(state: SudokuState) {
	return {
		givenMask: state.givenMask,
		values: state.values,
		notes: state.notes,
		selectedIndex: state.selectedIndex,
		selectedNumber: state.selectedNumber,
		inputMode: state.inputMode,
	};
}

export const useSudokuStore = create<SudokuState>((set, get) => ({
	...createGameState(),

	handleCellClick: (index) => {
		const state = get();
		const patch = handleCellClickInput(getInputState(state), getInputContext(state), index);
		set(patch);
	},

	selectNumber: (value) => {
		const state = get();
		const patch = selectNumberInput(getInputState(state), getInputContext(state), value);
		set(patch);
	},

	toggleCellNote: (index, value) => {
		const state = get();
		const patch = toggleCellNoteInput(getInputState(state), index, value);
		set(patch);
	},

	clearCellSelection: () => {
		set(clearCellSelectionInput());
	},

	setInputMode: (mode) => {
		set({ inputMode: mode, selectedNumber: null });
	},

	clearCell: () => {
		const state = get();
		const patch = clearCellInput(getInputState(state));
		set(patch);
	},

	startGame: (config) => {
		set(createGameState(config));
	},

	setActiveDialogId: (id) => {
		set({ activeDialogId: id });
	},

	closeActiveDialog: (parentWindowId) => {
		const { activeDialogId } = get();
		if (!activeDialogId) {
			return;
		}
		useChildWindowStore.getState().removeChild(parentWindowId, activeDialogId);
		set({ activeDialogId: null });
	},
}));
