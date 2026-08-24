import { Box } from '@mantine/core';

import { useMinesweeperStore } from '../store';
import { Cell } from './Cell';

export function Board() {
	const difficulty = useMinesweeperStore((s) => s.difficulty);
	const board = useMinesweeperStore((s) => s.board);
	const status = useMinesweeperStore((s) => s.status);
	const openCell = useMinesweeperStore((s) => s.openCell);
	const flagCell = useMinesweeperStore((s) => s.flagCell);
	const chordCell = useMinesweeperStore((s) => s.chordCell);

	const cellSize = difficulty.cols >= 30 ? 22 : difficulty.cols >= 16 ? 26 : 32;

	return (
		<Box
			style={{
				display: 'grid',
				gridTemplateColumns: `repeat(${difficulty.cols}, ${cellSize}px)`,
				width: 'fit-content',
				border: '2px solid var(--mantine-color-default-border)',
			}}
		>
			{board.map((cell, index) => (
				<Cell
					key={index}
					cell={cell}
					size={cellSize}
					lost={status === 'lost'}
					onOpen={() => openCell(index)}
					onFlag={() => flagCell(index)}
					onChord={() => chordCell(index)}
				/>
			))}
		</Box>
	);
}
