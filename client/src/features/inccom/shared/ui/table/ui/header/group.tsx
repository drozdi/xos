import { Group } from '@mantine/core';
import { useTableGroupingContext } from '../../context';
import classes from '../style.module.css';
import type { TableHeaderCellGroupProps } from '../type';
import { TableHeaderCellExpander } from './cell-expander';
import { TableHeaderCellSlot } from './cell-slot';
import { TableHeaderCellWrap } from './cell-wrap';
import { TableHeaderCellUnifiedExpander } from './unified-expander';

export function TableHeaderCellGroup<T = object>({
	column,
	maxRow,
	maxCol,
	...props
}: TableHeaderCellGroupProps<T>) {
	const { groupAt, groupColumnField } = useTableGroupingContext<T>();
	const isGroupOnly = column.isGroup && !column.isGrouped;
	const isGroupedOnly = column.isGrouped && !column.isGroup;
	const isUnified = column.isGroup && column.isGrouped;
	const isPrimaryGroupColumn =
		isGroupOnly &&
		(!groupColumnField || column.field === groupColumnField);
	const showHeaderLabel = !!column.header && !isGroupOnly;
	const innerClass = showHeaderLabel
		? classes['expanderHeaderInnerLabeled']
		: classes['expanderHeaderInner'];

	const expanders = isUnified ? (
		<TableHeaderCellUnifiedExpander<T> column={column} flex="0" {...props} />
	) : isPrimaryGroupColumn ? (
		<TableHeaderCellExpander<T> kind="group" column={column} flex="0" {...props} />
	) : isGroupedOnly ? (
		<TableHeaderCellExpander<T> kind="grouped" column={column} flex="0" {...props} />
	) : null;

	return (
		<TableHeaderCellWrap<T>
			column={column}
			maxRow={maxRow}
			maxCol={maxCol}
			className={isGroupOnly ? classes['expanderHeader'] : undefined}
		>
			<div className={innerClass}>
				{groupAt === 'start' && expanders && (
					<Group gap={4} wrap="nowrap" flex="0">
						{expanders}
					</Group>
				)}
				{showHeaderLabel && <TableHeaderCellSlot<T> column={column} />}
				{groupAt === 'end' && expanders && (
					<Group gap={4} wrap="nowrap" flex="0">
						{expanders}
					</Group>
				)}
			</div>
		</TableHeaderCellWrap>
	);
}
