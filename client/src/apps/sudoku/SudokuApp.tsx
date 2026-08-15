import { Box, Stack } from '@mantine/core';
import type { MouseEvent } from 'react';

import { Board, Information, Toolbar } from './components';
import { useSudokuStore } from './store';

function keepCellSelection(event: MouseEvent) {
	event.stopPropagation();
}

export default function SudokuApp() {
	const clearCellSelection = useSudokuStore((state) => state.clearCellSelection);

	return (
		<Box p="md" h="100%" onClick={() => clearCellSelection()}>
			<Stack gap="md" align="center">
				<Information />
				<Box onClick={keepCellSelection}>
					<Board />
				</Box>
				<Box onClick={keepCellSelection}>
					<Toolbar />
				</Box>
			</Stack>
		</Box>
	);
}
