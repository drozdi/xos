import { Button, Flex } from 'antd';
import type { MouseEvent } from 'react';

import { useCoreApi } from '@/core/hooks/useCoreApi';

import { Board, Information, Toolbar } from './components';
import { openNewGameDialog } from './openNewGameDialog';
import { useSudokuStore } from './store';

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

function keepCellSelection(event: MouseEvent) {
	event.stopPropagation();
}

export default function SudokuApp() {
	const coreApi = useCoreApi();
	const clearCellSelection = useSudokuStore((state) => state.clearCellSelection);

	return (
		<div style={{ padding: 16, height: '100%' }} onClick={() => clearCellSelection()}>
			<Flex vertical gap="middle" align="center">
				<Information />
				<div onClick={keepCellSelection}>
					<Board />
				</div>
				<div onClick={keepCellSelection}>
					<Toolbar />
				</div>
				<Flex style={{ width: '100%' }}>
					<Button type="primary" ghost icon={<ReloadIcon />} onClick={() => openNewGameDialog(coreApi)}>
						Новая игра
					</Button>
				</Flex>
			</Flex>
		</div>
	);
}
