import { Box, Button, Stack } from '@mantine/core';
import { useEffect } from 'react';

import { Field, Information } from './components';
import { checkGameResult } from './gameLogic';
import { useTicTacToeStore } from './store';

function ReloadIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
			<path d="M21 3v5h-5" />
			<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
			<path d="M3 21v-5h5" />
		</svg>
	);
}

export default function TicTacToeApp() {
	const field = useTicTacToeStore((state) => state.field);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const setWinner = useTicTacToeStore((state) => state.setWinner);
	const draw = useTicTacToeStore((state) => state.draw);
	const restart = useTicTacToeStore((state) => state.restart);

	useEffect(() => {
		if (isEnd) {
			return;
		}

		const result = checkGameResult(field);
		if (result.status === 'win') {
			setWinner(result.player);
			return;
		}
		if (result.status === 'draw') {
			draw();
		}
	}, [draw, field, isEnd, setWinner]);

	return (
		<Box p="md" h="100%">
			<Stack gap="md" align="stretch">
				<Information />
				<Field />
				<Button
					variant="light"
					leftSection={<ReloadIcon />}
					onClick={restart}
				>
					Новая игра
				</Button>
			</Stack>
		</Box>
	);
}
