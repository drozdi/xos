import { Box, Button, Group, Stack, Text } from '@mantine/core';

import { useCoreApiContext } from '@/core/context/CoreApiContext';

import { Foundation } from './components/Foundation';
import { StockWaste } from './components/StockWaste';
import { Tableau } from './components/Tableau';
import { openNewGameDialog } from './openNewGameDialog';
import { useSolitaireStore } from './store';

export default function SolitaireApp() {
	const coreApi = useCoreApiContext();
	const won = useSolitaireStore((s) => s.won);
	const drawMode = useSolitaireStore((s) => s.drawMode);
	const undo = useSolitaireStore((s) => s.undo);
	const history = useSolitaireStore((s) => s.history);
	const clearSelection = useSolitaireStore((s) => s.clearSelection);

	return (
		<Box
			p="md"
			h="100%"
			style={{ overflow: 'auto' }}
			onClick={(event) => {
				if (event.target === event.currentTarget) {
					clearSelection();
				}
			}}
		>
			<Stack gap="md">
				<Group justify="space-between" wrap="wrap">
					<Group gap="sm">
						<Button size="xs" variant="light" onClick={() => openNewGameDialog(coreApi)}>
							Новая игра
						</Button>
						<Button size="xs" variant="default" disabled={history.length === 0} onClick={undo}>
							Отменить
						</Button>
					</Group>
					<Text size="sm" c="dimmed">
						Раздача по {drawMode}
						{won ? ' — победа!' : ''}
					</Text>
				</Group>
				<Group justify="space-between" align="flex-start" wrap="wrap">
					<StockWaste />
					<Foundation />
				</Group>
				<Tableau />
				<Text size="xs" c="dimmed">
					Клик — выбрать карту, повторный клик по цели — ход. Двойной клик — на фундамент.
				</Text>
			</Stack>
		</Box>
	);
}
