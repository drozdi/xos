import { Button, Group, Text } from '@mantine/core';

import { useCoreApiContext } from '@/core/context/CoreApiContext';

import { getWindowSizeForBoard } from '../difficulty';
import { openNewGameDialog } from '../openNewGameDialog';
import { remainingMines, useMinesweeperStore } from '../store';

export function Toolbar() {
	const coreApi = useCoreApiContext();
	const difficulty = useMinesweeperStore((s) => s.difficulty);
	const status = useMinesweeperStore((s) => s.status);
	const elapsedSec = useMinesweeperStore((s) => s.elapsedSec);
	const board = useMinesweeperStore((s) => s.board);
	const startGame = useMinesweeperStore((s) => s.startGame);

	const minesLeft = remainingMines({ difficulty, board });
	const face = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂';

	return (
		<Group justify="space-between" wrap="nowrap">
			<Text fw={700} style={{ fontVariantNumeric: 'tabular-nums', minWidth: 48 }}>
				{String(minesLeft).padStart(3, '0')}
			</Text>
			<Button
				variant="light"
				size="compact-md"
				onClick={() => {
					startGame(difficulty);
					const size = getWindowSizeForBoard(difficulty);
					coreApi.window.setSize(size.width, size.height);
				}}
				aria-label="Новая игра"
			>
				{face}
			</Button>
			<Text fw={700} style={{ fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'right' }}>
				{String(elapsedSec).padStart(3, '0')}
			</Text>
			<Button size="compact-xs" variant="subtle" onClick={() => openNewGameDialog(coreApi)}>
				Сложность
			</Button>
		</Group>
	);
}
