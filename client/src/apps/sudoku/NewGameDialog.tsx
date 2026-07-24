import { Button, Flex, Radio, Typography } from 'antd';
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
		<Flex vertical gap="middle">
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Выберите размер поля и сложность. Чем выше сложность, тем меньше цифр дано изначально.
			</Typography.Text>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Размер
			</Typography.Title>
			<Radio.Group value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
				<Flex vertical gap="small">
					{SUDOKU_SIZES.map((size) => (
						<Radio key={size.id} value={size.id}>
							{size.label}
						</Radio>
					))}
				</Flex>
			</Radio.Group>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Сложность
			</Typography.Title>
			<Radio.Group value={difficultyId} onChange={(e) => setDifficultyId(e.target.value)}>
				<Flex vertical gap="small">
					{SUDOKU_DIFFICULTIES.map((difficulty) => (
						<Radio key={difficulty.id} value={difficulty.id}>
							{`${difficulty.label} — ${getClueCount(sizeId, difficulty.id)} цифр`}
						</Radio>
					))}
				</Flex>
			</Radio.Group>
			<Typography.Text style={{ fontSize: 13 }}>Будет дано {clueCount} цифр.</Typography.Text>
			<Button type="primary" onClick={handleStart}>
				Начать
			</Button>
		</Flex>
	);
}
