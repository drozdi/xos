import { Text } from '@mantine/core';

import { useTicTacToeStore } from '../store';

export function Information() {
	const player = useTicTacToeStore((state) => state.player);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const isDraw = useTicTacToeStore((state) => state.isDraw);
	const difficulty = useTicTacToeStore((state) => state.difficulty);
	const size = useTicTacToeStore((state) => state.size);
	const winLength = useTicTacToeStore((state) => state.winLength);

	let message = `Ходит: ${player}`;
	if (isDraw) {
		message = 'Ничья';
	} else if (isEnd) {
		message = `Выиграл: ${player}`;
	}

	return (
		<StackInfo
			message={message}
			meta={`${difficulty.label} · ${size}×${size} · ${winLength} в ряд`}
		/>
	);
}

function StackInfo({ message, meta }: { message: string; meta: string }) {
	return (
		<>
			<Text ta="center" size="lg" fw={600}>
				{message}
			</Text>
			<Text ta="center" size="xs" c="dimmed">
				{meta}
			</Text>
		</>
	);
}
