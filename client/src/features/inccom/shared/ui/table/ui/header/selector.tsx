import { Checkbox } from '@mantine/core';
import { useTableRowActionsContext, useTableSelectionContext } from '../../context';
import classes from '../style.module.css';
import type { TableHeaderCellWrapProps } from '../type';
import { TableHeaderBulkActions } from './bulk-actions';
import { TableHeaderCellWrap } from './cell-wrap';

export interface TableHeaderCellSelectorProps<T = object>
	extends TableHeaderCellWrapProps<T> {}

export function TableHeaderCellSelector<T = object>({
	column,
	maxRow,
	maxCol,
}: TableHeaderCellSelectorProps<T>) {
	const { allSelected, someSelected, selectAll } = useTableSelectionContext<T>();
	const { rowActionsOnHover, hasActionsColumn } = useTableRowActionsContext<T>();
	const showBulkInSelect = !(rowActionsOnHover && !hasActionsColumn);

	return (
		<TableHeaderCellWrap<T>
			column={column}
			maxRow={maxRow}
			maxCol={maxCol}
			className={classes.selectHeader}
		>
			<div className={classes.selectHeaderInner}>
				<Checkbox
					checked={allSelected}
					indeterminate={someSelected}
					onChange={(e) => selectAll(e.currentTarget.checked)}
				/>
				{showBulkInSelect ? <TableHeaderBulkActions target="select" /> : null}
			</div>
		</TableHeaderCellWrap>
	);
}
