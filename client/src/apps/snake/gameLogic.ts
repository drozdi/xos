export const SNAKE_SIZE = 20;

export type Point = { x: number; y: number };
export type SnakeDirection = 'up' | 'down' | 'left' | 'right';

export const OPPOSITE: Record<SnakeDirection, SnakeDirection> = {
	up: 'down',
	down: 'up',
	left: 'right',
	right: 'left',
};

export function createInitialSnake(): Point[] {
	const mid = Math.floor(SNAKE_SIZE / 2);
	return [
		{ x: mid, y: mid },
		{ x: mid - 1, y: mid },
		{ x: mid - 2, y: mid },
	];
}

export function pointsEqual(a: Point, b: Point): boolean {
	return a.x === b.x && a.y === b.y;
}

export function nextHead(head: Point, direction: SnakeDirection): Point {
	switch (direction) {
		case 'up':
			return { x: head.x, y: head.y - 1 };
		case 'down':
			return { x: head.x, y: head.y + 1 };
		case 'left':
			return { x: head.x - 1, y: head.y };
		case 'right':
			return { x: head.x + 1, y: head.y };
	}
}

export function isOutOfBounds(point: Point): boolean {
	return point.x < 0 || point.y < 0 || point.x >= SNAKE_SIZE || point.y >= SNAKE_SIZE;
}

export function hitsSelf(snake: Point[], point: Point): boolean {
	return snake.some((segment) => pointsEqual(segment, point));
}

export function spawnFood(snake: Point[], random = Math.random): Point {
	const free: Point[] = [];
	for (let y = 0; y < SNAKE_SIZE; y++) {
		for (let x = 0; x < SNAKE_SIZE; x++) {
			const p = { x, y };
			if (!hitsSelf(snake, p)) {
				free.push(p);
			}
		}
	}
	if (free.length === 0) {
		return { x: 0, y: 0 };
	}
	return free[Math.floor(random() * free.length)]!;
}

export function stepSnake(
	snake: Point[],
	direction: SnakeDirection,
	food: Point,
): { snake: Point[]; food: Point; grew: boolean; dead: boolean } {
	const head = snake[0];
	if (!head) {
		return { snake, food, grew: false, dead: true };
	}
	const next = nextHead(head, direction);
	if (isOutOfBounds(next) || hitsSelf(snake, next)) {
		return { snake, food, grew: false, dead: true };
	}
	const grew = pointsEqual(next, food);
	const body = grew ? snake : snake.slice(0, -1);
	const nextSnake = [next, ...body];
	return {
		snake: nextSnake,
		food: grew ? spawnFood(nextSnake) : food,
		grew,
		dead: false,
	};
}
