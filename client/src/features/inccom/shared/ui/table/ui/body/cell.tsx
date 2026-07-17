import { memo, useCallback } from 'react';
import { useTableEditContext, useTableGroupingContext } from '../../context';
import classes from '../style.module.css';
import type { ColumnEntity } from '../../type';
import type { TableBodyCellProps } from '../type';
import { TableBodyCellActions } from './actions-cell';
import { TableBodyCellExpander } from './cell-expander';
import { TableBodyCellSlot } from './cell-slot';
import { TableBodyCellWrap } from './cell-wrap';
import { TableBodyCellExpand } from './expand';
import { TableBodyCellHoverSlot } from './hover-slot-cell';
import { TableBodyCellSelector } from './selector';
import { TableBodyUnifiedExpander } from './unified-expander';

function GroupedGroupCellContent<T>({
	node,
	column,
	columns,
	isLastInGroupedBlock,
}: {
	node: TableBodyCellProps<T>['node'];
	column: TableBodyCellProps<T>['column'];
	columns?: ColumnEntity<T>[];
	isLastInGroupedBlock?: boolean;
}) {
	const { groupAt } = useTableGroupingContext<T>();

	return (
		<div className={classes['expanderHeaderInnerLabeled']}>
			{groupAt === 'start' && <TableBodyUnifiedExpander<T> node={node} column={column} />}
			<TableBodyCellSlot<T>
				node={node}
				column={column}
				columns={columns}
				isLastInGroupedBlock={isLastInGroupedBlock}
			/>
			{groupAt === 'end' && <TableBodyUnifiedExpander<T> node={node} column={column} />}
		</div>
	);
}

function TableBodyCellInner<T>({
	node,
	column,
	columns,
	columnIndex,
	isEditing,
	isLastInGroupedBlock,
}: TableBodyCellProps<T> & { isEditing: boolean }) {
	const { updateNode, commitEdit } = useTableEditContext<T>();
	const { groupAt } = useTableGroupingContext<T>();

	const handleCommitEdit = useCallback(() => commitEdit(node.index), [commitEdit, node.index]);
	const handleUpdate = useCallback(
		(value: T[keyof T]) => updateNode(node.index, column.field as keyof T, value),
		[updateNode, node.index, column.field],
	);

	if (column.isSelecting) {
		return <TableBodyCellSelector<T> node={node} column={column} />;
	}
	if (column.isActions) {
		return <TableBodyCellActions<T> node={node} column={column} />;
	}
	if (column.isHoverSlot) {
		return <TableBodyCellHoverSlot<T> node={node} column={column} />;
	}
	if (column.isGroup && !column.isGrouped) {
		return (
			<TableBodyCellExpand<T>
				node={node}
				column={column}
				columns={columns}
				columnIndex={columnIndex}
			/>
		);
	}
	if (column.isGroup && column.isGrouped) {
		return (
			<TableBodyCellWrap<T>
				column={column}
				columns={columns}
				columnIndex={columnIndex}
				node={node}
				plain
			>
				<GroupedGroupCellContent<T>
					node={node}
					column={column}
					columns={columns}
					isLastInGroupedBlock={isLastInGroupedBlock}
				/>
			</TableBodyCellWrap>
		);
	}

	return (
		<TableBodyCellWrap<T> column={column} columns={columns} columnIndex={columnIndex} node={node}>
			{groupAt === 'start' && <TableBodyCellExpander<T> node={node} column={column} />}
			{(isEditing &&
				column.editor?.(node.data, column, handleUpdate, handleCommitEdit)) || (
				<TableBodyCellSlot<T>
					node={node}
					column={column}
					columns={columns}
					isLastInGroupedBlock={isLastInGroupedBlock}
				/>
			)}
			{groupAt === 'end' && <TableBodyCellExpander<T> node={node} column={column} />}
		</TableBodyCellWrap>
	);
}

function areCellPropsEqual<T>(
	prev: TableBodyCellProps<T> & { isEditing: boolean },
	next: TableBodyCellProps<T> & { isEditing: boolean },
): boolean {
	return (
		prev.node === next.node &&
		prev.column === next.column &&
		prev.columns === next.columns &&
		prev.columnIndex === next.columnIndex &&
		prev.isEditing === next.isEditing &&
		prev.isLastInGroupedBlock === next.isLastInGroupedBlock
	);
}

const MemoizedTableBodyCellInner = memo(TableBodyCellInner, areCellPropsEqual) as typeof TableBodyCellInner;

export function TableBodyCell<T = object>(props: TableBodyCellProps<T> & { isEditing?: boolean }) {
	return (
		<MemoizedTableBodyCellInner
			{...props}
			isEditing={props.isEditing ?? false}
			isLastInGroupedBlock={props.isLastInGroupedBlock ?? false}
		/>
	);
}
