import { Button, Radio, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApiContext } from '@/core/context/CoreApiContext';

import {
	SUDOKU_DIFFICULTIES,
	SUDOKU_SIZES,
	buildGameConfig,
	getClueCount,
} from './difficulty';
import { getWindowSizeForBoard } from './gameLogic';
import { useSudokuStore } from './store';

export function NewGameDialog() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApiContext();
	const startGame = useSudokuStore((state) => state.startGame);
	const closeActiveDialog = useSudokuStore((state) => state.closeActiveDialog);
	const [sizeId, setSizeId] = useState(SUDOKU_SIZES[2]!.id);
	const [difficultyId, setDifficultyId] = useState(SUDOKU_DIFFICULTIES[0]!.id);

	const handleStart = () => {
		const config = buildGameConfig(sizeId, difficultyId);
		if (!config) {
			return;
		}

		startGame(config);
		const { width, height } = getWindowSizeForBoard(config.size.size);
		coreApi.window.setSize(width, height);
		closeActiveDialog(windowId);
	};

	const clueCount = getClueCount(sizeId, difficultyId);

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Выберите размер поля и сложность. Чем выше сложность, тем меньше цифр дано изначально.
			</Text>
			<Title order={6}>Размер</Title>
			<Radio.Group value={sizeId} onChange={setSizeId}>
				<Stack gap="xs">
					{SUDOKU_SIZES.map((size) => (
						<Radio key={size.id} value={size.id} label={size.label} />
					))}
				</Stack>
			</Radio.Group>
			<Title order={6}>Сложность</Title>
			<Radio.Group value={difficultyId} onChange={setDifficultyId}>
				<Stack gap="xs">
					{SUDOKU_DIFFICULTIES.map((difficulty) => (
						<Radio
							key={difficulty.id}
							value={difficulty.id}
							label={`${difficulty.label} — ${getClueCount(sizeId, difficulty.id)} цифр`}
						/>
					))}
				</Stack>
			</Radio.Group>
			<Text size="sm">Будет дано {clueCount} цифр.</Text>
			<Button onClick={handleStart}>Начать</Button>
		</Stack>
	);
}
