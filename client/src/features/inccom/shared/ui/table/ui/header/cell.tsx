import { Group } from '@mantine/core';
import type {
	TableHeaderCellProps
} from '../type';

import { TableHeaderCellActions } from './actions-cell';
import { TableHeaderCellDrager } from './cell-drager';
import { TableHeaderCellResizer } from './cell-resizer';
import { TableHeaderCellSlot } from './cell-slot';
import { TableHeaderCellSorter } from './cell-sorter';
import { TableHeaderCellToggler } from './cell-toggler';
import { TableHeaderCellWrap } from './cell-wrap';
import { TableHeaderCellGroup } from './group';
import { TableHeaderCellHoverSlot } from './hover-slot-cell';
import { TableHeaderCellSelector } from './selector';

export function TableHeaderCell<T = object>({
	column,
	maxCol,
	maxRow,
}: TableHeaderCellProps<T>) {
	if (column.isSelecting) {
		return <TableHeaderCellSelector column={column} maxRow={maxRow} maxCol={maxCol} />;
	}
	if (column.isActions) {
		return <TableHeaderCellActions<T> column={column} maxRow={maxRow} maxCol={maxCol} />;
	}
	if (column.isHoverSlot) {
		return <TableHeaderCellHoverSlot<T> column={column} maxRow={maxRow} maxCol={maxCol} />;
	}
	if (column.isGroup || column.isGrouped) {
		return <TableHeaderCellGroup<T> column={column} maxRow={maxRow} maxCol={maxCol} />;
	}
	const justifyContent =
		column.align === 'right'
			? 'flex-end'
			: column.align === 'left'
				? 'flex-start' // ✅ Исправлено: 'flex-start'
				: column.align === 'center'
					? 'center'
					: 'flex-start';
	return (
		<TableHeaderCellWrap<T> column={column} maxRow={maxRow} maxCol={maxCol}>
			<Group justify={justifyContent} align='center' wrap="nowrap" grow gap="0">
				<TableHeaderCellDrager<T> column={column} />
				<TableHeaderCellSlot<T> column={column} />
				<Group
					flex="0"
					gap="0"
					justify="flex-end"
					wrap="nowrap"
					onMouseDown={(event) => {
						event.preventDefault();
					}}
				>
					<TableHeaderCellSorter<T> column={column} />
					<TableHeaderCellToggler<T> column={column} />
				</Group>
			</Group>
			<TableHeaderCellResizer<T> column={column} />
		</TableHeaderCellWrap>
	);
}
