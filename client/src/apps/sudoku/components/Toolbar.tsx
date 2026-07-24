import { Button, Flex, Segmented } from 'antd';

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
		<Flex vertical gap="small">
			<Segmented
				value={inputMode}
				onChange={(value) => setInputMode(value as 'pen' | 'pencil')}
				options={[
					{ value: 'pen', label: 'Ручка' },
					{ value: 'pencil', label: 'Карандаш' },
				]}
			/>
			<Flex gap="small" wrap="wrap">
				{Array.from({ length: sizeConfig.size }, (_, index) => {
					const number = index + 1;
					const isPaintActive = selectedNumber === number;
					const isCellValue = selectedIndex !== null && selectedCellValue === number;
					const isCellNote =
						selectedIndex !== null &&
						selectedCellValue === 0 &&
						hasNote(selectedCellNotes, number);

					let type: 'primary' | 'default' | 'dashed' = 'default';
					if (isPaintActive) {
						type = 'primary';
					} else if (isCellValue) {
						type = 'primary';
					} else if (isCellNote) {
						type = 'dashed';
					}

					return (
						<Button
							key={number}
							type={type}
							ghost={isCellValue && !isPaintActive}
							size="small"
							style={{ width: 36, padding: 0 }}
							onClick={() => selectNumber(number)}
						>
							{number}
						</Button>
					);
				})}
				<Button size="small" onClick={clearCell} disabled={!canEditSelectedCell}>
					Стереть
				</Button>
			</Flex>
		</Flex>
	);
}
