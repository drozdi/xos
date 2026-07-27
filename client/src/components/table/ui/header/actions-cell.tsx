import { Group } from '@mantine/core';
import type { TableHeaderCellWrapProps } from '../type';
import { TableHeaderBulkActions } from './bulk-actions';
import { TableHeaderCellWrap } from './cell-wrap';

export function TableHeaderCellActions<T = object>({
	column,
	maxCol,
	maxRow,
}: TableHeaderCellWrapProps<T>) {
	return (
		<TableHeaderCellWrap<T> column={column} maxRow={maxRow} maxCol={maxCol}>
			<Group justify="center" wrap="nowrap" gap={4}>
				{typeof column.header === 'function' ? column.header(column) : column.header}
				<TableHeaderBulkActions target="actions" actionsMenu={column.actionsMenu} />
			</Group>
		</TableHeaderCellWrap>
	);
}
