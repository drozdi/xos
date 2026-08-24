import { Button, Radio, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApiContext } from '@/core/context/CoreApiContext';

import { DIFFICULTIES, getWindowSizeForBoard } from './difficulty';
import { useMinesweeperStore } from './store';

export function NewGameDialog() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApiContext();
	const startGame = useMinesweeperStore((s) => s.startGame);
	const closeActiveDialog = useMinesweeperStore((s) => s.closeActiveDialog);
	const currentId = useMinesweeperStore((s) => s.difficulty.id);
	const [selectedId, setSelectedId] = useState(currentId);

	const handleStart = () => {
		const difficulty = DIFFICULTIES.find((item) => item.id === selectedId);
		if (!difficulty) {
			return;
		}
		startGame(difficulty);
		const size = getWindowSizeForBoard(difficulty);
		coreApi.window.setSize(size.width, size.height);
		closeActiveDialog(windowId);
	};

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Выберите сложность. Размер поля и число мин зависят от уровня.
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
									{` — ${difficulty.rows}×${difficulty.cols}, мин: ${difficulty.mines}`}
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
