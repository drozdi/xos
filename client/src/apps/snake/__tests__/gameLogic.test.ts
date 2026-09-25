import { describe, expect, it } from 'vitest';

import {
	createInitialSnake,
	isOutOfBounds,
	nextHead,
	spawnFood,
	stepSnake,
} from '../gameLogic';

describe('snake logic', () => {
	it('moves right and keeps length without food', () => {
		const snake = createInitialSnake();
		const food = { x: 0, y: 0 };
		const result = stepSnake(snake, 'right', food);
		expect(result.dead).toBe(false);
		expect(result.grew).toBe(false);
		expect(result.snake).toHaveLength(snake.length);
		expect(result.snake[0]).toEqual(nextHead(snake[0]!, 'right'));
	});

	it('grows when eating food', () => {
		const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
		const food = { x: 6, y: 5 };
		const result = stepSnake(snake, 'right', food);
		expect(result.grew).toBe(true);
		expect(result.snake).toHaveLength(3);
	});

	it('dies out of bounds', () => {
		expect(isOutOfBounds({ x: -1, y: 0 })).toBe(true);
		const snake = [{ x: 0, y: 0 }];
		const result = stepSnake(snake, 'left', spawnFood(snake, () => 0));
		expect(result.dead).toBe(true);
	});
});
