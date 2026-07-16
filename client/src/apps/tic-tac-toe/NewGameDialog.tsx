import { Button, Radio, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApiContext } from '@/core/context/CoreApiContext';

import { DIFFICULTIES } from './difficulty';
import { useTicTacToeStore } from './store';

function getWindowSizeForBoard(size: number) {
	const cellSize = size <= 3 ? 72 : size === 4 ? 56 : 48;
	const boardHeight = size * cellSize + (size - 1) * 8;
	return {
		width: Math.max(320, size * cellSize + (size - 1) * 8 + 48),
		height: Math.max(380, boardHeight + 200),
	};
}

export function NewGameDialog() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApiContext();
	const startGame = useTicTacToeStore((state) => state.startGame);
	const closeActiveDialog = useTicTacToeStore((state) => state.closeActiveDialog);
	const [selectedId, setSelectedId] = useState(DIFFICULTIES[0]!.id);

	const handleStart = () => {
		const difficulty = DIFFICULTIES.find((item) => item.id === selectedId);
		if (!difficulty) {
			return;
		}

		startGame(difficulty);
		const { width, height } = getWindowSizeForBoard(difficulty.size);
		coreApi.window.setSize(width, height);
		closeActiveDialog(windowId);
	};

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Выберите сложность. Размер поля и число фигур в ряд для победы зависят от уровня.
			</Text>
			<Radio.Group value={selectedId} onChange={setSelectedId}>
				<Stack gap="sm">
					{DIFFICULTIES.map((difficulty) => (
						<Radio
							key={difficulty.id}
							value={difficulty.id}
							label={
								<Text size="sm">
									<Text span fw={600}>
										{difficulty.label}
									</Text>
									{' — '}
									{difficulty.size}×{difficulty.size}, победа: {difficulty.winLength} в ряд
								</Text>
							}
						/>
					))}
				</Stack>
			</Radio.Group>
			<Button onClick={handleStart}>Начать</Button>
		</Stack>
	);
}
