import { Text } from '@mantine/core';

import { useTicTacToeStore } from '../store';

export function Information() {
	const player = useTicTacToeStore((state) => state.player);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const isDraw = useTicTacToeStore((state) => state.isDraw);

	let message = `Ходит: ${player}`;
	if (isDraw) {
		message = 'Ничья';
	} else if (isEnd) {
		message = `Выиграл: ${player}`;
	}

	return (
		<Text ta="center" size="lg" fw={600}>
			{message}
		</Text>
	);
}
