import { Button, SimpleGrid } from '@mantine/core';

import { useTicTacToeStore } from '../store';

function getCellHeight(size: number): number {
	if (size <= 3) {return 72;}
	if (size === 4) {return 56;}
	return 48;
}

export function Field() {
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const field = useTicTacToeStore((state) => state.field);
	const size = useTicTacToeStore((state) => state.size);
	const playMove = useTicTacToeStore((state) => state.playMove);
	const cellHeight = getCellHeight(size);

	return (
		<SimpleGrid cols={size} spacing="xs">
			{field.map((cell, index) => (
				<Button
					key={index}
					fullWidth
					variant="default"
					size={size <= 3 ? 'xl' : 'lg'}
					h={cellHeight}
					onClick={() => playMove(index)}
					disabled={isEnd || Boolean(cell)}
				>
					{cell}
				</Button>
			))}
		</SimpleGrid>
	);
}
