import { Box, Stack, Text } from '@mantine/core';
import { useEffect } from 'react';

import { Board } from './components/Board';
import { Toolbar } from './components/Toolbar';
import { useMinesweeperStore } from './store';

export default function MinesweeperApp() {
	const status = useMinesweeperStore((s) => s.status);
	const tick = useMinesweeperStore((s) => s.tick);
	const difficulty = useMinesweeperStore((s) => s.difficulty);

	useEffect(() => {
		if (status !== 'playing') {
			return;
		}
		const id = window.setInterval(() => tick(), 1000);
		return () => window.clearInterval(id);
	}, [status, tick]);

	return (
		<Box p="md" h="100%" style={{ overflow: 'auto' }}>
			<Stack gap="md" align="center">
				<Toolbar />
				<Text size="sm" c="dimmed">
					{difficulty.label}: {difficulty.rows}×{difficulty.cols}, мин: {difficulty.mines}
					{status === 'won' ? ' — победа!' : status === 'lost' ? ' — проигрыш' : ''}
				</Text>
				<Board />
			</Stack>
		</Box>
	);
}
