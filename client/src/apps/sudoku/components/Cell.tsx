import { Box, Text } from '@mantine/core';
import type { MouseEvent } from 'react';

import { getNoteGrid } from '../difficulty';
import { getNotePosition, hasConflict, hasNote } from '../gameLogic';
import { useSudokuStore } from '../store';

interface CellProps {
	index: number;
	cellSize: number;
	isBoxBorderRight: boolean;
	isBoxBorderBottom: boolean;
}

export function Cell({ index, cellSize, isBoxBorderRight, isBoxBorderBottom }: CellProps) {
	const sizeConfig = useSudokuStore((state) => state.config.size);
	const value = useSudokuStore((state) => state.values[index]);
	const notes = useSudokuStore((state) => state.notes[index]);
	const givenMask = useSudokuStore((state) => state.givenMask[index]);
	const selectedIndex = useSudokuStore((state) => state.selectedIndex);
	const handleCellClick = useSudokuStore((state) => state.handleCellClick);
	const toggleCellNote = useSudokuStore((state) => state.toggleCellNote);
	const selectedNumber = useSudokuStore((state) => state.selectedNumber);
	const values = useSudokuStore((state) => state.values);
	const hasError = value !== 0 && hasConflict(values, sizeConfig, index);

	const noteGrid = getNoteGrid(sizeConfig);
	const isSelected = selectedIndex === index;
	const isHighlighted =
		selectedNumber !== null &&
		(value === selectedNumber ||
			((notes ?? 0) !== 0 && hasNote(notes ?? 0, selectedNumber)));

	const handleNoteClick = (event: MouseEvent, number: number) => {
		event.stopPropagation();
		toggleCellNote(index, number);
	};

	return (
		<Box
			component="div"
			role="gridcell"
			tabIndex={0}
			onClick={() => handleCellClick(index)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					handleCellClick(index);
				}
			}}
			style={{
				width: cellSize,
				height: cellSize,
				padding: 0,
				border: '1px solid var(--mantine-color-gray-4)',
				borderRightWidth: isBoxBorderRight ? 2 : 1,
				borderBottomWidth: isBoxBorderBottom ? 2 : 1,
				background: isSelected
					? 'var(--mantine-color-blue-1)'
					: isHighlighted
						? 'var(--mantine-color-blue-0)'
						: 'var(--mantine-color-white)',
				cursor: 'pointer',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{value !== 0 ? (
				<Text
					size={sizeConfig.size <= 4 ? 'xl' : sizeConfig.size === 6 ? 'lg' : 'md'}
					fw={givenMask ? 700 : 500}
					c={hasError ? 'red' : givenMask ? 'dark' : 'blue'}
					ta="center"
					lh={`${cellSize}px`}
				>
					{value}
				</Text>
			) : (notes ?? 0) !== 0 ? (
				<Box
					style={{
						display: 'grid',
						gridTemplateColumns: `repeat(${noteGrid.cols}, 1fr)`,
						gridTemplateRows: `repeat(${noteGrid.rows}, 1fr)`,
						width: '100%',
						height: '100%',
					}}
				>
					{Array.from({ length: sizeConfig.size }, (_, noteValue) => {
						const number = noteValue + 1;
						const { row, col } = getNotePosition(number, noteGrid.cols);
						const isActive = hasNote(notes ?? 0, number);
						return (
							<Box
								key={number}
								component={isActive ? 'button' : 'span'}
								type={isActive ? 'button' : undefined}
								onClick={
									isActive
										? (event: MouseEvent<HTMLButtonElement>) => handleNoteClick(event, number)
										: undefined
								}
								style={{
									gridRow: row + 1,
									gridColumn: col + 1,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									padding: 0,
									border: 'none',
									background: 'transparent',
									cursor: isActive ? 'pointer' : 'default',
									visibility: isActive ? 'visible' : 'hidden',
								}}
							>
								<Text
									size="xs"
									c="dimmed"
									ta="center"
									style={{
										fontSize: Math.max(8, Math.floor(cellSize / (noteGrid.rows * 2.5))),
										lineHeight: 1,
									}}
								>
									{number}
								</Text>
							</Box>
						);
					})}
				</Box>
			) : null}
		</Box>
	);
}
