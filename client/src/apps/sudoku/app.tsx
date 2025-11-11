import { Button, Group, SegmentedControl, SimpleGrid, Stack } from '@mantine/core';
import { Window } from '../../components/window';
import { Cell } from './components/Cell';
import store from './store';

export function AppSudoku() {
	const { cells, size, setMod, setValue, mod, value } = store();

	return (
		<Window title="Судоку" h={600} resizable draggable icons="reload collapse close">
			<Stack h="100%" align="stretch" justify="flex-start" gap="xs">
				<Group justify="space-between">
					<Button>Сбросить</Button>
					<Button>Очистить</Button>
					<Button>Создать</Button>
				</Group>
				<SimpleGrid cols={size}>
					{cells.map((value, row) =>
						value.map((value, col) => (
							<Cell key={`${row}-${col}`} row={row} col={col} />
						)),
					)}
				</SimpleGrid>
				<SegmentedControl
					value={value}
					onChange={setValue}
					data={new Array(size).fill(0).map((_, index) => String(index + 1))}
				/>
				<SegmentedControl
					value={mod}
					onChange={setMod}
					data={[
						{
							value: 'pen',
							label: 'Ручка',
						},
						{
							value: 'pencil',
							label: 'Карандаш',
						},
					]}
				/>
			</Stack>
		</Window>
	);
}

AppSudoku.displayName = 'apps/sudoku/app';

export default AppSudoku;
