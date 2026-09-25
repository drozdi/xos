import { create } from 'zustand';

import {
	OPPOSITE,
	createInitialSnake,
	spawnFood,
	stepSnake,
	type Point,
	type SnakeDirection,
} from './gameLogic';

export type SnakeStatus = 'ready' | 'playing' | 'paused' | 'dead';

interface SnakeState {
	snake: Point[];
	food: Point;
	direction: SnakeDirection;
	queuedDirection: SnakeDirection;
	status: SnakeStatus;
	score: number;
	newGame: () => void;
	start: () => void;
	togglePause: () => void;
	queueDirection: (direction: SnakeDirection) => void;
	tick: () => void;
}

function fresh() {
	const snake = createInitialSnake();
	return {
		snake,
		food: spawnFood(snake),
		direction: 'right' as SnakeDirection,
		queuedDirection: 'right' as SnakeDirection,
		status: 'ready' as SnakeStatus,
		score: 0,
	};
}

export const useSnakeStore = create<SnakeState>((set, get) => ({
	...fresh(),
	newGame: () => set(fresh()),
	start: () => {
		const { status } = get();
		if (status === 'ready' || status === 'dead') {
			if (status === 'dead') {
				set({ ...fresh(), status: 'playing' });
			} else {
				set({ status: 'playing' });
			}
		}
	},
	togglePause: () => {
		const { status } = get();
		if (status === 'playing') {
			set({ status: 'paused' });
		} else if (status === 'paused') {
			set({ status: 'playing' });
		}
	},
	queueDirection: (direction) => {
		const { direction: current, status } = get();
		if (status !== 'playing' && status !== 'ready') {
			return;
		}
		if (OPPOSITE[current] === direction) {
			return;
		}
		set({ queuedDirection: direction });
		if (status === 'ready') {
			set({ status: 'playing', direction, queuedDirection: direction });
		}
	},
	tick: () => {
		const state = get();
		if (state.status !== 'playing') {
			return;
		}
		const direction = state.queuedDirection;
		const result = stepSnake(state.snake, direction, state.food);
		if (result.dead) {
			set({ status: 'dead', direction });
			return;
		}
		set({
			snake: result.snake,
			food: result.food,
			direction,
			score: result.grew ? state.score + 1 : state.score,
		});
	},
}));
