import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { useEffect, useMemo } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { SNAKE_SIZE, type SnakeDirection } from './gameLogic';
import { useSnakeStore } from './store';

const KEY_TO_DIR: Record<string, SnakeDirection> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
	w: 'up',
	s: 'down',
	a: 'left',
	d: 'right',
};

export default function SnakeApp() {
	useWindowTitle('Змейка');
	const snake = useSnakeStore((s) => s.snake);
	const food = useSnakeStore((s) => s.food);
	const status = useSnakeStore((s) => s.status);
	const score = useSnakeStore((s) => s.score);
	const tick = useSnakeStore((s) => s.tick);
	const queueDirection = useSnakeStore((s) => s.queueDirection);
	const newGame = useSnakeStore((s) => s.newGame);
	const togglePause = useSnakeStore((s) => s.togglePause);
	const start = useSnakeStore((s) => s.start);

	const occupied = useMemo(() => {
		const set = new Set(snake.map((p) => `${p.x},${p.y}`));
		return set;
	}, [snake]);

	useEffect(() => {
		if (status !== 'playing') {
			return;
		}
		const id = window.setInterval(() => tick(), 120);
		return () => window.clearInterval(id);
	}, [status, tick]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === ' ' || e.code === 'Space') {
				e.preventDefault();
				togglePause();
				return;
			}
			const dir = KEY_TO_DIR[e.key] ?? KEY_TO_DIR[e.key.toLowerCase()];
			if (!dir) {
				return;
			}
			e.preventDefault();
			queueDirection(dir);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [queueDirection, togglePause]);

	return (
		<Box p="md" h="100%" style={{ overflow: 'auto' }}>
			<Stack gap="md" align="center">
				<Group>
					<Text fw={600}>Очки: {score}</Text>
					{status === 'ready' ? (
						<Button size="xs" onClick={() => start()}>
							Старт
						</Button>
					) : null}
					{status === 'playing' || status === 'paused' ? (
						<Button size="xs" variant="light" onClick={() => togglePause()}>
							{status === 'paused' ? 'Продолжить' : 'Пауза'}
						</Button>
					) : null}
					<Button size="xs" variant="default" onClick={() => newGame()}>
						Новая игра
					</Button>
				</Group>
				{status === 'dead' ? (
					<Text c="red" fw={600}>
						Столкновение
					</Text>
				) : null}
				{status === 'paused' ? (
					<Text c="dimmed" fw={600}>
						Пауза
					</Text>
				) : null}
				<Box
					style={{
						display: 'grid',
						gridTemplateColumns: `repeat(${SNAKE_SIZE}, 1fr)`,
						width: 'min(100%, 360px)',
						aspectRatio: '1',
						gap: 1,
						background: 'var(--mantine-color-dark-6)',
						padding: 4,
						borderRadius: 6,
					}}
				>
					{Array.from({ length: SNAKE_SIZE * SNAKE_SIZE }, (_, i) => {
						const x = i % SNAKE_SIZE;
						const y = Math.floor(i / SNAKE_SIZE);
						const isSnake = occupied.has(`${x},${y}`);
						const isFood = food.x === x && food.y === y;
						const isHead = snake[0]?.x === x && snake[0]?.y === y;
						return (
							<Box
								key={i}
								style={{
									background: isFood
										? 'var(--mantine-color-red-6)'
										: isHead
											? 'var(--mantine-color-green-5)'
											: isSnake
												? 'var(--mantine-color-green-7)'
												: 'var(--mantine-color-dark-8)',
									borderRadius: 2,
								}}
							/>
						);
					})}
				</Box>
				<Text size="xs" c="dimmed">
					Стрелки / WASD · пробел — пауза
				</Text>
			</Stack>
		</Box>
	);
}
