import { Box, Text } from '@mantine/core';
import type { CSSProperties, MouseEvent } from 'react';

import { type Card as CardModel, isRed, rankLabel, suitSymbol } from '../deck';

const CARD_W = 72;
const CARD_H = 100;

interface CardProps {
	card: CardModel;
	selected?: boolean;
	onClick?: () => void;
	onDoubleClick?: () => void;
	onContextMenu?: () => void;
	style?: CSSProperties;
}

export function CardView({ card, selected, onClick, onDoubleClick, onContextMenu, style }: CardProps) {
	const handleContextMenu = onContextMenu
		? (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				onContextMenu();
			}
		: undefined;

	if (!card.faceUp) {
		return (
			<Box
				onClick={onClick}
				onContextMenu={handleContextMenu}
				style={{
					width: CARD_W,
					height: CARD_H,
					borderRadius: 8,
					border: '1px solid var(--mantine-color-default-border)',
					background:
						'repeating-linear-gradient(45deg, var(--mantine-color-blue-7), var(--mantine-color-blue-7) 6px, var(--mantine-color-blue-8) 6px, var(--mantine-color-blue-8) 12px)',
					boxShadow: selected ? '0 0 0 2px var(--mantine-color-yellow-5)' : undefined,
					cursor: onClick ? 'pointer' : 'default',
					...style,
				}}
			/>
		);
	}

	const color = isRed(card.suit) ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-text)';

	return (
		<Box
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			onContextMenu={handleContextMenu}
			style={{
				width: CARD_W,
				height: CARD_H,
				borderRadius: 8,
				border: selected
					? '2px solid var(--mantine-color-yellow-5)'
					: '1px solid var(--mantine-color-default-border)',
				background: 'var(--mantine-color-body)',
				padding: 6,
				cursor: onClick ? 'pointer' : 'default',
				userSelect: 'none',
				...style,
			}}
		>
			<Text size="sm" fw={700} style={{ color }} lh={1.1}>
				{rankLabel(card.rank)}
				{suitSymbol(card.suit)}
			</Text>
			<Text
				ta="center"
				style={{
					color,
					fontSize: 28,
					marginTop: 12,
					lineHeight: 1,
				}}
			>
				{suitSymbol(card.suit)}
			</Text>
		</Box>
	);
}

export function EmptySlot({
	label,
	selected,
	onClick,
	onContextMenu,
}: {
	label?: string;
	selected?: boolean;
	onClick?: () => void;
	onContextMenu?: () => void;
}) {
	return (
		<Box
			onClick={onClick}
			onContextMenu={
				onContextMenu
					? (event) => {
							event.preventDefault();
							event.stopPropagation();
							onContextMenu();
						}
					: undefined
			}
			style={{
				width: CARD_W,
				height: CARD_H,
				borderRadius: 8,
				border: selected
					? '2px dashed var(--mantine-color-yellow-5)'
					: '2px dashed var(--mantine-color-default-border)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: onClick ? 'pointer' : 'default',
				opacity: 0.7,
			}}
		>
			{label ? (
				<Text size="xs" c="dimmed">
					{label}
				</Text>
			) : null}
		</Box>
	);
}

export { CARD_H, CARD_W };
