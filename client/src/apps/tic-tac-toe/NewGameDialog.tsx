import { Button, Flex, Radio, Typography } from 'antd';
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
		<Flex vertical gap="middle">
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Выберите сложность. Размер поля и число фигур в ряд для победы зависят от уровня.
			</Typography.Text>
			<Radio.Group value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
				<Flex vertical gap="small">
					{DIFFICULTIES.map((difficulty) => (
						<Radio key={difficulty.id} value={difficulty.id}>
							<span style={{ fontSize: 13 }}>
								<strong>{difficulty.label}</strong>
								{' — '}
								{difficulty.size}×{difficulty.size}, победа: {difficulty.winLength} в ряд
							</span>
						</Radio>
					))}
				</Flex>
			</Radio.Group>
			<Button type="primary" onClick={handleStart}>
				Начать
			</Button>
		</Flex>
	);
}
