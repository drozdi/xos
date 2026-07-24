import { Typography } from 'antd';

import { useTicTacToeStore } from '../store';

export function Information() {
	const player = useTicTacToeStore((state) => state.player);
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const isDraw = useTicTacToeStore((state) => state.isDraw);
	const difficulty = useTicTacToeStore((state) => state.difficulty);
	const size = useTicTacToeStore((state) => state.size);
	const winLength = useTicTacToeStore((state) => state.winLength);

	let message = `Ходит: ${player}`;
	if (isDraw) {
		message = 'Ничья';
	} else if (isEnd) {
		message = `Выиграл: ${player}`;
	}

	return (
		<>
			<Typography.Text strong style={{ display: 'block', textAlign: 'center', fontSize: 18 }}>
				{message}
			</Typography.Text>
			<Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
				{`${difficulty.label} · ${size}×${size} · ${winLength} в ряд`}
			</Typography.Text>
		</>
	);
}
