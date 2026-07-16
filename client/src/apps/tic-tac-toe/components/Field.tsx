import { Button, SimpleGrid } from '@mantine/core';

import { useTicTacToeStore } from '../store';

export function Field() {
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const field = useTicTacToeStore((state) => state.field);
	const playMove = useTicTacToeStore((state) => state.playMove);

	return (
		<SimpleGrid cols={3} spacing="xs">
			{field.map((cell, index) => (
				<Button
					key={index}
					fullWidth
					variant="default"
					size="xl"
					h={72}
					onClick={() => playMove(index)}
					disabled={isEnd || Boolean(cell)}
				>
					{cell}
				</Button>
			))}
		</SimpleGrid>
	);
}
