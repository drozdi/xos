import { Box, Group } from '@mantine/core';

import { useSolitaireStore } from '../store';
import { CardView, EmptySlot } from './Card';

const FACE_UP_OFFSET = 22;
const FACE_DOWN_OFFSET = 12;

export function Tableau() {
	const tableau = useSolitaireStore((s) => s.tableau);
	const selected = useSolitaireStore((s) => s.selected);
	const selectPile = useSolitaireStore((s) => s.selectPile);
	const dropOnTableau = useSolitaireStore((s) => s.dropOnTableau);
	const autoMove = useSolitaireStore((s) => s.autoMove);

	return (
		<Group gap="sm" align="flex-start" wrap="nowrap">
			{tableau.map((column, col) => (
				<Box
					key={col}
					style={{
						position: 'relative',
						width: 72,
						minHeight: 100,
					}}
					onClick={() => {
						if (column.length === 0 && selected) {
							dropOnTableau(col);
						}
					}}
				>
					{column.length === 0 ? (
						<EmptySlot
							selected={Boolean(selected)}
							onClick={() => {
								if (selected) {
									dropOnTableau(col);
								}
							}}
						/>
					) : (
						column.map((card, index) => {
							const offset = column
								.slice(0, index)
								.reduce((sum, c) => sum + (c.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET), 0);
							const isSelected =
								selected?.type === 'tableau' &&
								selected.col === col &&
								index >= selected.index;
							return (
								<CardView
									key={`${card.id}-${index}`}
									card={card}
									selected={isSelected}
									onClick={() => {
										if (selected) {
											if (
												selected.type === 'tableau' &&
												selected.col === col &&
												selected.index === index
											) {
												selectPile({ type: 'tableau', col, index });
												return;
											}
											dropOnTableau(col);
											return;
										}
										if (card.faceUp) {
											selectPile({ type: 'tableau', col, index });
										}
									}}
									onDoubleClick={() => {
										if (card.faceUp && index === column.length - 1) {
											autoMove({ type: 'tableau', col, index });
										}
									}}
									style={{
										position: 'absolute',
										top: offset,
										left: 0,
										zIndex: index,
									}}
								/>
							);
						})
					)}
				</Box>
			))}
		</Group>
	);
}
