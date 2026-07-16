import { Collapse, Table } from '@mantine/core';
import { useMemo } from 'react';
import { useTableDataContext, useTableEditContext, useTableExpandContext, useTableGroupingContext } from '../../context';
import {
	getBodyColumnPhysicalSpan,
	getHeaderCellKey,
	isGroupOnlyExpanderColumn,
	sumBodyColumnPhysicalSpans,
} from '../../utils/column-fields';
import {
	getGroupNestedColumns,
	getGroupNestedData,
	getGroupOnlyNestedRowLayout,
	getNestedTableColumns,
	getNodeExpandKey,
	hasGroupNestedData,
} from '../../utils/group-by';
import { TableData } from '../../TableData';
import type { TableDataProps, TableGroupLayout, ColumnEntity } from '../../type';
import type { TableBodyGroupProps } from '../type';
import classes from '../style.module.css';

function resolveNestedGroupLayout(groupKeysLength: number): TableGroupLayout {
	if (groupKeysLength > 1) {
		return 'grouped-first';
	}
	return 'default';
}

function NestedLayoutPlaceholderCell<T>({ column }: { column: ColumnEntity<T> }) {
	const isGroupOnly = isGroupOnlyExpanderColumn(column);
	return (
		<Table.Td
			key={getHeaderCellKey(column)}
			p="0"
			aria-hidden
			colSpan={getBodyColumnPhysicalSpan(column)}
			className={isGroupOnly ? classes['expanderCell'] : undefined}
		/>
	);
}

function GroupNestedRowCells<T>({
	beforeColumns,
	afterColumns,
	expandColumn,
	nestedColumns,
	nestedBeforeExpander,
	groupAt,
	children,
}: {
	beforeColumns: ColumnEntity<T>[];
	afterColumns: ColumnEntity<T>[];
	expandColumn: ColumnEntity<T>;
	nestedColumns: ColumnEntity<T>[];
	nestedBeforeExpander: boolean;
	groupAt: 'start' | 'end';
	children: React.ReactNode;
}) {
	const nestedColspan = Math.max(
		nestedColumns.reduce((sum, col) => sum + getBodyColumnPhysicalSpan(col), 0),
		1,
	);
	const expanderCell = <NestedLayoutPlaceholderCell<T> key="expander" column={expandColumn} />;
	const nestedCell = (
		<Table.Td key="nested" p="0" colSpan={nestedColspan}>
			{children}
		</Table.Td>
	);

	if (nestedBeforeExpander) {
		return (
			<>
				{nestedCell}
				{expanderCell}
				{groupAt === 'end' &&
					afterColumns.map((col) => <NestedLayoutPlaceholderCell<T> key={getHeaderCellKey(col)} column={col} />)}
			</>
		);
	}

	return (
		<>
			{beforeColumns.map((col) => (
				<NestedLayoutPlaceholderCell<T> key={getHeaderCellKey(col)} column={col} />
			))}
			{expanderCell}
			{nestedCell}
			{groupAt === 'end' &&
				afterColumns.map((col) => <NestedLayoutPlaceholderCell<T> key={getHeaderCellKey(col)} column={col} />)}
		</>
	);
}

export function TableBodyGroup<T = object>({ node, columns, column, level = 0 }: TableBodyGroupProps<T>) {
	const { props } = useTableDataContext<T>();
	const { editMode } = useTableEditContext<T>();
	const { groupAt, groupLayout, groupKeys } = useTableGroupingContext<T>();
	const { isExpanded } = useTableExpandContext();
	const isGroupFirst = groupLayout === 'group-first';

	const nestedColumns = useMemo(
		() => (isGroupFirst ? getGroupNestedColumns(columns) : getNestedTableColumns(columns)),
		[columns, isGroupFirst],
	);

	const nestedGroupKeys = useMemo(
		() => (isGroupFirst ? groupKeys : []),
		[isGroupFirst, groupKeys],
	);

	const nestedGroupLayout = useMemo(
		() => (isGroupFirst ? resolveNestedGroupLayout(groupKeys.length) : 'default'),
		[isGroupFirst, groupKeys.length],
	);

	const rowLayout = useMemo(
		() => getGroupOnlyNestedRowLayout(columns, column, groupAt),
		[columns, column, groupAt],
	);

	if (!column.isGroup || !hasGroupNestedData(node, column)) {
		return null;
	}

	const isExpand = isExpanded(getNodeExpandKey(node), 'group');
	const nestedData = getGroupNestedData(node, column);
	const isRendered = !!column.body;

	const Tag = (column.body || TableData<T>) as React.FC<TableDataProps<T>>;

	const nestedTable = (
		<Collapse expanded={isExpand} p={isRendered ? 'xs' : '0'}>
			<Tag
				{...(props as TableDataProps<T>)}
				data={nestedData}
				columns={nestedColumns}
				groupKeys={nestedGroupKeys}
				groupAt={groupAt}
				groupLayout={nestedGroupLayout}
				level={level}
				editMode={editMode}
				withHeader={false}
				withPagination={false}
			/>
		</Collapse>
	);

	return (
		<Table.Tr
			style={{
				borderBottomWidth: isExpand ? '2px' : '',
			}}
		>
			{isRendered ? (
				<Table.Td p="0" colSpan={sumBodyColumnPhysicalSpans(columns)}>
					{nestedTable}
				</Table.Td>
			) : (
				<GroupNestedRowCells<T> groupAt={groupAt ?? 'start'} {...rowLayout}>
					{nestedTable}
				</GroupNestedRowCells>
			)}
		</Table.Tr>
	);
}
