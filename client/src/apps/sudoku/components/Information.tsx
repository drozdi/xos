import { Text } from '@mantine/core';

import { useSudokuStore } from '../store';

export function Information() {
	const config = useSudokuStore((state) => state.config);
	const isComplete = useSudokuStore((state) => state.isComplete);
	const filledCount = useSudokuStore(
		(state) => state.values.filter((value) => value !== 0).length,
	);
	const total = config.size.size * config.size.size;

	return (
		<Text size="sm" c="dimmed">
			{config.size.label} · {config.difficulty.label} · дано {config.clueCount} цифр
			{' · '}
			заполнено {filledCount}/{total}
			{isComplete ? ' · Готово!' : ''}
		</Text>
	);
}
