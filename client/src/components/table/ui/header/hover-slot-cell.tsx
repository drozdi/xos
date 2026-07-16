import { useTableRowActionsContext } from '../../context';
import classes from '../style.module.css';
import type { TableHeaderCellWrapProps } from '../type';
import { TableHeaderBulkActions, useTableHeaderBulkActions } from './bulk-actions';
import { TableHeaderCellWrap } from './cell-wrap';

export function TableHeaderCellHoverSlot<T = object>({
	column,
	maxCol,
	maxRow,
}: TableHeaderCellWrapProps<T>) {
	const { rowActionsOnHover, hasActionsColumn, rowActionsAt } = useTableRowActionsContext<T>();
	const { isConfigured, canShow } = useTableHeaderBulkActions('select');
	const showBulk = rowActionsOnHover && !hasActionsColumn && isConfigured;
	const position = column.actionsAt ?? rowActionsAt;

	return (
		<TableHeaderCellWrap<T>
			column={column}
			maxRow={maxRow}
			maxCol={maxCol}
			className={classes.hoverSlotHeader}
		>
			{showBulk ? (
				<div
					className={classes.hoverSlotOverlay}
					data-position={position}
					data-visible={canShow ? '' : undefined}
				>
					<TableHeaderBulkActions target="select" />
				</div>
			) : null}
		</TableHeaderCellWrap>
	);
}
