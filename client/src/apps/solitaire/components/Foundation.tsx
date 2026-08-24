import { Group } from '@mantine/core';

import { useSolitaireStore } from '../store';
import { CARD_W, CardView, EmptySlot } from './Card';

export function Foundation() {
	const foundations = useSolitaireStore((s) => s.foundations);
	const selected = useSolitaireStore((s) => s.selected);
	const selectPile = useSolitaireStore((s) => s.selectPile);
	const dropOnFoundation = useSolitaireStore((s) => s.dropOnFoundation);

	return (
		<Group gap="sm" wrap="nowrap">
			{foundations.map((pile, index) => {
				const top = pile[pile.length - 1];
				const isSelected =
					selected?.type === 'foundation' && selected.index === index;
				if (!top) {
					return (
						<EmptySlot
							key={index}
							label="A"
							selected={Boolean(selected) && !isSelected}
							onClick={() => {
								if (selected) {
									dropOnFoundation(index);
								}
							}}
						/>
					);
				}
				return (
					<CardView
						key={index}
						card={top}
						selected={isSelected}
						onClick={() => {
							if (selected && !isSelected) {
								dropOnFoundation(index);
								return;
							}
							selectPile({ type: 'foundation', index });
						}}
						style={{ width: CARD_W }}
					/>
				);
			})}
		</Group>
	);
}
