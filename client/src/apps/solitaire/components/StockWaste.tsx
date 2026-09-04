import { Box, Group, Text } from '@mantine/core';

import { useSolitaireStore } from '../store';
import { CARD_W, CardView, EmptySlot } from './Card';

export function StockWaste() {
	const stock = useSolitaireStore((s) => s.stock);
	const waste = useSolitaireStore((s) => s.waste);
	const drawMode = useSolitaireStore((s) => s.drawMode);
	const selected = useSolitaireStore((s) => s.selected);
	const draw = useSolitaireStore((s) => s.draw);
	const selectPile = useSolitaireStore((s) => s.selectPile);
	const autoMove = useSolitaireStore((s) => s.autoMove);
	const autoPlace = useSolitaireStore((s) => s.autoPlace);
	const autoMoveAll = useSolitaireStore((s) => s.autoMoveAll);

	const visibleWaste = waste.slice(-Math.max(1, drawMode));

	return (
		<Group gap="sm" wrap="nowrap" align="flex-start">
			{stock.length > 0 ? (
				<CardView
					card={{ ...stock[stock.length - 1]!, faceUp: false }}
					onClick={draw}
					onContextMenu={autoMoveAll}
				/>
			) : (
				<EmptySlot label="↻" onClick={draw} onContextMenu={autoMoveAll} />
			)}
			<Box style={{ position: 'relative', width: CARD_W + (visibleWaste.length - 1) * 18, height: 100 }}>
				{waste.length === 0 ? (
					<EmptySlot onContextMenu={autoMoveAll} />
				) : (
					visibleWaste.map((card, offset) => {
						const absoluteIndex = waste.length - visibleWaste.length + offset;
						const isTop = absoluteIndex === waste.length - 1;
						return (
							<CardView
								key={`${card.id}-${absoluteIndex}`}
								card={card}
								selected={isTop && selected?.type === 'waste'}
								onClick={() => {
									if (isTop) {
										selectPile({ type: 'waste' });
									}
								}}
								onDoubleClick={() => {
									if (isTop) {
										autoMove({ type: 'waste' });
									}
								}}
								onContextMenu={() => {
									if (isTop) {
										autoPlace({ type: 'waste' });
									} else {
										autoMoveAll();
									}
								}}
								style={{
									position: 'absolute',
									left: offset * 18,
									top: 0,
									zIndex: offset,
								}}
							/>
						);
					})
				)}
			</Box>
			<Text size="xs" c="dimmed" mt={4}>
				сток: {stock.length}
			</Text>
		</Group>
	);
}
