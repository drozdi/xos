import { Button, Group, SegmentedControl, Stack } from '@mantine/core';

import { hasNote } from '../gameLogic';
import { useSudokuStore } from '../store';

export function Toolbar() {
	const sizeConfig = useSudokuStore((state) => state.config.size);
	const inputMode = useSudokuStore((state) => state.inputMode);
	const setInputMode = useSudokuStore((state) => state.setInputMode);
	const selectNumber = useSudokuStore((state) => state.selectNumber);
	const clearCell = useSudokuStore((state) => state.clearCell);
	const selectedIndex = useSudokuStore((state) => state.selectedIndex);
	const selectedNumber = useSudokuStore((state) => state.selectedNumber);
	const givenMask = useSudokuStore((state) => state.givenMask);
	const notes = useSudokuStore((state) => state.notes);
	const values = useSudokuStore((state) => state.values);

	const canEditSelectedCell =
		selectedIndex !== null && !givenMask[selectedIndex];

	const selectedCellNotes = selectedIndex !== null ? (notes[selectedIndex] ?? 0) : 0;
	const selectedCellValue = selectedIndex !== null ? (values[selectedIndex] ?? 0) : 0;

	return (
		<Stack gap="sm">
			<SegmentedControl
				value={inputMode}
				onChange={(value) => setInputMode(value as 'pen' | 'pencil')}
				data={[
					{ value: 'pen', label: 'Ручка' },
					{ value: 'pencil', label: 'Карандаш' },
				]}
			/>
			<Group gap="xs" wrap="wrap">
				{Array.from({ length: sizeConfig.size }, (_, index) => {
					const number = index + 1;
					const isPaintActive = selectedNumber === number;
					const isCellValue = selectedIndex !== null && selectedCellValue === number;
					const isCellNote =
						selectedIndex !== null &&
						selectedCellValue === 0 &&
						hasNote(selectedCellNotes, number);

					let variant: 'filled' | 'outline' | 'light' = 'light';
					let color: string | undefined;

					if (isPaintActive) {
						variant = 'filled';
					} else if (isCellValue) {
						variant = 'light';
						color = 'blue';
					} else if (isCellNote) {
						variant = 'outline';
						color = 'gray';
					}

					return (
						<Button
							key={number}
							variant={variant}
							color={color}
							size="sm"
							w={36}
							p={0}
							onClick={() => selectNumber(number)}
						>
							{number}
						</Button>
					);
				})}
				<Button
					variant="default"
					size="sm"
					onClick={clearCell}
					disabled={!canEditSelectedCell}
				>
					Стереть
				</Button>
			</Group>
		</Stack>
	);
}
