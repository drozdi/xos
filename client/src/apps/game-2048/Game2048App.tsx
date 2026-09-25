import { Box, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useEffect } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { SIZE, type Direction } from './gameLogic';
import { useGame2048Store } from './store';

const TILE_COLORS: Record<number, { bg: string; color: string }> = {
	0: { bg: 'var(--mantine-color-gray-2)', color: 'transparent' },
	2: { bg: '#eee4da', color: '#776e65' },
	4: { bg: '#ede0c8', color: '#776e65' },
	8: { bg: '#f2b179', color: '#f9f6f2' },
	16: { bg: '#f59563', color: '#f9f6f2' },
	32: { bg: '#f67c5f', color: '#f9f6f2' },
	64: { bg: '#f65e3b', color: '#f9f6f2' },
	128: { bg: '#edcf72', color: '#f9f6f2' },
	256: { bg: '#edcc61', color: '#f9f6f2' },
	512: { bg: '#edc850', color: '#f9f6f2' },
	1024: { bg: '#edc53f', color: '#f9f6f2' },
	2048: { bg: '#edc22e', color: '#f9f6f2' },
};

const KEY_TO_DIR: Record<string, Direction> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
	w: 'up',
	s: 'down',
	a: 'left',
	d: 'right',
};

export default function Game2048App() {
	useWindowTitle('2048');
	const board = useGame2048Store((s) => s.board);
	const score = useGame2048Store((s) => s.score);
	const best = useGame2048Store((s) => s.best);
	const status = useGame2048Store((s) => s.status);
	const move = useGame2048Store((s) => s.move);
	const newGame = useGame2048Store((s) => s.newGame);
	const continueAfterWin = useGame2048Store((s) => s.continueAfterWin);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const dir = KEY_TO_DIR[e.key] ?? KEY_TO_DIR[e.key.toLowerCase()];
			if (!dir) {
				return;
			}
			e.preventDefault();
			move(dir);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [move]);

	return (
		<Box p="md" h="100%" style={{ overflow: 'auto' }}>
			<Stack gap="md" align="center">
				<Group gap="lg">
					<Text fw={600}>Счёт: {score}</Text>
					<Text c="dimmed">Рекорд: {best}</Text>
					<Button size="xs" variant="light" onClick={() => newGame()}>
						Новая игра
					</Button>
				</Group>
				{status === 'won' ? (
					<Group>
						<Text c="green" fw={600}>
							2048!
						</Text>
						<Button size="xs" onClick={() => continueAfterWin()}>
							Продолжить
						</Button>
					</Group>
				) : null}
				{status === 'lost' ? (
					<Text c="red" fw={600}>
						Ходов больше нет
					</Text>
				) : null}
				<SimpleGrid
					cols={SIZE}
					spacing={8}
					style={{
						width: 'min(100%, 320px)',
						background: 'var(--mantine-color-gray-4)',
						padding: 8,
						borderRadius: 8,
					}}
				>
					{board.flatMap((row, r) =>
						row.map((value, c) => {
							const colors = TILE_COLORS[value] ?? { bg: '#3c3a32', color: '#f9f6f2' };
							return (
								<Box
									key={`${r}-${c}`}
									style={{
										aspectRatio: '1',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										borderRadius: 6,
										background: colors.bg,
										color: colors.color,
										fontWeight: 700,
										fontSize: value >= 1024 ? 18 : 22,
									}}
								>
									{value || ''}
								</Box>
							);
						}),
					)}
				</SimpleGrid>
				<Text size="xs" c="dimmed">
					Стрелки или WASD
				</Text>
			</Stack>
		</Box>
	);
}
