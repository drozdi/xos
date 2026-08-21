import { Box } from '@mantine/core';

import { useSudokuStore } from '../store';
import { Cell } from './Cell';

function getCellSize(size: number): number {
	if (size <= 4) {return 64;}
	if (size === 6) {return 48;}
	return 40;
}

export function Board() {
	const sizeConfig = useSudokuStore((state) => state.config.size);
	const { size, boxRows, boxCols } = sizeConfig;
	const cellSize = getCellSize(size);

	return (
		<Box
			style={{
				display: 'grid',
				gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
				border: '2px solid var(--mantine-color-default-border)',
				width: 'fit-content',
			}}
		>
			{Array.from({ length: size * size }, (_, index) => {
				const row = Math.floor(index / size);
				const col = index % size;
				const isBoxBorderRight = col === size - 1 || (col + 1) % boxCols === 0;
				const isBoxBorderBottom = row === size - 1 || (row + 1) % boxRows === 0;

				return (
					<Cell
						key={index}
						index={index}
						cellSize={cellSize}
						isBoxBorderRight={isBoxBorderRight}
						isBoxBorderBottom={isBoxBorderBottom}
					/>
				);
			})}
		</Box>
	);
}
