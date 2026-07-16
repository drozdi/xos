import { hasGroupNestedData } from '../../utils/group-by';
import classes from '../style.module.css';
import type { TableBodyCellExpandProps } from '../type';
import { TableBodyCellWrap } from './cell-wrap';
import { TableBodyExpander } from './expander';

export function TableBodyCellExpand<T = object>({
	node,
	column,
	columns,
	columnIndex,
}: TableBodyCellExpandProps<T>) {
	if (!hasGroupNestedData(node, column)) {
		return (
			<TableBodyCellWrap<T>
				node={node}

				column={column}
				columns={columns}
				columnIndex={columnIndex}
				className={classes.expanderCell}
			/>
		);
	}
	return (
		<TableBodyCellWrap<T>
			node={node}
			column={column}
			columns={columns}
			columnIndex={columnIndex}
			className={classes.expanderCell}
		>
			<div className={classes.expanderHeaderInner}>
				<TableBodyExpander<T>
					kind="group"
					node={node}
					column={column}
					className={classes.expanderCell}
				/>
			</div>
		</TableBodyCellWrap>
	);
}
