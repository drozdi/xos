import { Box, Stack } from '@mantine/core';
import { useEffect } from 'react';

import { Field, Information } from './components';
import { checkGameResult } from './gameLogic';
import { useTicTacToeStore } from './store';

export default function TicTacToeApp() {
	const field = useTicTacToeStore((state) => state.field);
	const winLines = useTicTacToeStore((state) => state.winLines);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const setWinner = useTicTacToeStore((state) => state.setWinner);
	const draw = useTicTacToeStore((state) => state.draw);

	useEffect(() => {
		if (isEnd) {
			return;
		}

		const result = checkGameResult(field, winLines);
		if (result.status === 'win') {
			setWinner(result.player);
			return;
		}
		if (result.status === 'draw') {
			draw();
		}
	}, [draw, field, isEnd, setWinner, winLines]);

	return (
		<Box p="md" h="100%">
			<Stack gap="md" align="stretch">
				<Information />
				<Field />
			</Stack>
		</Box>
	);
}
