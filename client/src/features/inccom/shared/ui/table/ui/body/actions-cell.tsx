import { Group } from '@mantine/core';
import { useMemo } from 'react';
import { useTableRowActionsContext } from '../../context';
import type { TableBodyCellBaseProps } from '../type';
import { resolveVisibleActions } from '../../utils/row-actions';
import { TableRowActionsMenu, TableRowActionsPanel } from '../row-actions/panel';
import { TableBodyCellWrap } from './cell-wrap';

export function TableBodyCellActions<T = object>({ node, column }: TableBodyCellBaseProps<T>) {
	const { rowActions } = useTableRowActionsContext<T>();
	const visibleActions = useMemo(
		() => resolveVisibleActions(node, rowActions),
		[node, rowActions],
	);

	if (!visibleActions.length) {
		return <TableBodyCellWrap<T> node={node} column={column} />;
	}

	const Panel = column.actionsMenu ? TableRowActionsMenu : TableRowActionsPanel;

	return (
		<TableBodyCellWrap<T> node={node} column={column}>
			<Group justify="center" wrap="nowrap">
				<Panel node={node} actions={visibleActions} />
			</Group>
		</TableBodyCellWrap>
	);
}
