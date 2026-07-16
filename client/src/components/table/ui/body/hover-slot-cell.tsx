import { useMemo } from 'react';
import { useTableRowActionsContext } from '../../context';
import { resolveVisibleActions } from '../../utils/row-actions';
import { TableRowActionsPanel } from '../row-actions/panel';
import classes from '../style.module.css';
import type { TableBodyCellBaseProps } from '../type';
import { TableBodyCellWrap } from './cell-wrap';

export function TableBodyCellHoverSlot<T = object>({ node, column }: TableBodyCellBaseProps<T>) {
	const { rowActions, rowActionsPanel, rowActionsAt } = useTableRowActionsContext<T>();
	const visibleActions = useMemo(
		() => resolveVisibleActions(node, rowActions),
		[node, rowActions],
	);

	const Panel = rowActionsPanel ?? TableRowActionsPanel;
	const position = column.actionsAt ?? rowActionsAt;

	return (
		<TableBodyCellWrap<T>
			node={node}
			column={column}
			className={classes.hoverSlotCell}
		>
			{visibleActions.length > 0 ? (
				<div className={classes.hoverSlotOverlay} data-position={position}>
					<Panel node={node} actions={visibleActions} />
				</div>
			) : null}
		</TableBodyCellWrap>
	);
}
