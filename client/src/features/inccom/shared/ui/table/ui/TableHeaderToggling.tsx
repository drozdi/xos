import { Checkbox, Stack } from '@mantine/core';
import { useTableColumnMetaContext } from '../context';
import type { ColumnEntity } from '../type';
import { TableHeaderCellSlot } from './header';
export interface TableHeaderTogglingProps<T = object> {
	columns: ColumnEntity<T>[];
}

export function TableHeaderToggling<T = object>({ columns }: TableHeaderTogglingProps<T>) {
	const { hiddenColumns, toggleColumn } = useTableColumnMetaContext<T>();
	return (
		<Stack>
			{columns.filter((column) => column.isToggleable).map((column) => (
				<Checkbox
					key={column.field as string}
					value={column.field as string}
					label={<TableHeaderCellSlot column={column} />}
					checked={!hiddenColumns.includes(column.field as keyof T)}
					onChange={(event) => {
						const isVisible = event.currentTarget.checked;
						toggleColumn(column, !isVisible);
					}}
				/>
			))}
		</Stack>
	);
}