import { useTableGroupingContext } from '../../context';
import { isGroupedExpanderCell } from '../../utils/group-by';
import type { TableBodyCellExpanderProps } from '../type';
import { TableBodyExpander } from './expander';

export function TableBodyCellExpander<T = object>({ node, column }: TableBodyCellExpanderProps<T>) {
	const { groupKeys } = useTableGroupingContext<T>();

	if (!isGroupedExpanderCell(node, column, groupKeys)) {
		return null;
	}

	return <TableBodyExpander<T> kind="grouped" node={node} column={column} flex="0" />;
}
