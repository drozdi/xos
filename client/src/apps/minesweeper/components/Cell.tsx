import { Box, Text } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';

import type { Cell as CellModel } from '../gameLogic';

const NUMBER_COLORS: Record<number, string> = {
	1: '#1971c2',
	2: '#2f9e44',
	3: '#e03131',
	4: '#364fc7',
	5: '#c92a2a',
	6: '#0c8599',
	7: 'var(--mantine-color-text)',
	8: 'var(--mantine-color-dimmed)',
};

interface CellProps {
	cell: CellModel;
	size: number;
	lost: boolean;
	onOpen: () => void;
	onFlag: () => void;
	onChord: () => void;
}

export function Cell({ cell, size, lost, onOpen, onFlag, onChord }: CellProps) {
	const handleClick = (event: MouseEvent) => {
		event.preventDefault();
		if (event.button === 0) {
			if (cell.state === 'open') {
				onChord();
			} else {
				onOpen();
			}
		}
	};

	const handleContext = (event: MouseEvent) => {
		event.preventDefault();
		onFlag();
	};

	let content: ReactNode = null;
	if (cell.state === 'flagged') {
		content = '🚩';
	} else if (cell.state === 'open') {
		if (cell.mine) {
			content = '💣';
		} else if (cell.adjacent > 0) {
			content = (
				<Text
					fw={700}
					size="sm"
					style={{ color: NUMBER_COLORS[cell.adjacent] ?? 'var(--mantine-color-text)' }}
				>
					{cell.adjacent}
				</Text>
			);
		}
	} else if (lost && cell.mine) {
		content = '💣';
	}

	const opened = cell.state === 'open';

	return (
		<Box
			component="button"
			type="button"
			onClick={handleClick}
			onContextMenu={handleContext}
			style={{
				width: size,
				height: size,
				padding: 0,
				margin: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				border: '1px solid var(--mantine-color-default-border)',
				background: opened
					? 'var(--mantine-color-default)'
					: 'var(--mantine-color-body)',
				boxShadow: opened ? 'none' : 'inset 0 0 0 1px var(--mantine-color-default-border)',
				cursor: 'pointer',
				fontSize: Math.max(10, Math.floor(size * 0.45)),
				lineHeight: 1,
			}}
		>
			{content}
		</Box>
	);
}
