import { Button } from 'antd';

import { useTicTacToeStore } from '../store';

function getCellHeight(size: number): number {
	if (size <= 3) {
		return 72;
	}
	if (size === 4) {
		return 56;
	}
	return 48;
}

export function Field() {
	const isEnd = useTicTacToeStore((state) => state.isEnd);
	const field = useTicTacToeStore((state) => state.field);
	const size = useTicTacToeStore((state) => state.size);
	const playMove = useTicTacToeStore((state) => state.playMove);
	const cellHeight = getCellHeight(size);

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: `repeat(${size}, 1fr)`,
				gap: 8,
			}}
		>
			{field.map((cell, index) => (
				<Button
					key={index}
					block
					size={size <= 3 ? 'large' : 'middle'}
					style={{ height: cellHeight, fontSize: size <= 3 ? 24 : 18 }}
					onClick={() => playMove(index)}
					disabled={isEnd || Boolean(cell)}
				>
					{cell}
				</Button>
			))}
		</div>
	);
}
