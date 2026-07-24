import { Button, Flex } from 'antd';
import { useEffect } from 'react';

import { useCoreApi } from '@/core/hooks/useCoreApi';

import { Field, Information } from './components';
import { checkGameResult } from './gameLogic';
import { openNewGameDialog } from './openNewGameDialog';
import { useTicTacToeStore } from './store';

function ReloadIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
			<path d="M21 3v5h-5" />
			<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
			<path d="M3 21v-5h5" />
		</svg>
	);
}

export default function TicTacToeApp() {
	const coreApi = useCoreApi();
	const field = useTicTacToeStore((state) => state.field);
	const winLines = useTicTacToeStore((state) => state.winLines);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const setWinner = useTicTacToeStore((state) => state.setWinner);
	const draw = useTicTacToeStore((state) => state.draw);

	useEffect(() => {
		if (isEnd) {
			return;
		}

		const result = checkGameResult(field, winLines);
		if (result.status === 'win') {
			setWinner(result.player);
			return;
		}
		if (result.status === 'draw') {
			draw();
		}
	}, [draw, field, isEnd, setWinner, winLines]);

	return (
		<div style={{ padding: 16, height: '100%' }}>
			<Flex vertical gap="middle" align="stretch">
				<Information />
				<Field />
				<Button type="primary" ghost icon={<ReloadIcon />} onClick={() => openNewGameDialog(coreApi)}>
					Новая игра
				</Button>
			</Flex>
		</div>
	);
}
