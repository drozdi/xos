import { Collapse, Table } from '@mantine/core';
import { useMemo } from 'react';
import { useTableDataContext, useTableExpandContext, useTableGroupingContext } from '../../context';
import { TableData } from '../../TableData';
import type { TableDataProps } from '../../type';
import {
	alignNestedColumnsFromExpander,
	getGroupedColumnForLevel,
	getGroupedNestedColumns,
	getNestedExpandLayout,
	getNodeExpandKey,
	groupChildrenForExpand,
} from '../../utils/group-by';
import type { TableBodyGroupedProps, TableBodyRowProps } from '../type';
import { TableBodyRow } from './row';

function TableBodyGroupedInline<T = object>({
	node,
	columns,
	level = 0,
}: TableBodyGroupedProps<T>) {
	const { groupKeys, multiGroup } = useTableGroupingContext<T>();
	const { isExpanded } = useTableExpandContext();

	const parentLevel = node.groupLevel ?? 0;
	const expandKey = getNodeExpandKey(node);
	const isExpand = isExpanded(expandKey, 'grouped');

	const group = useMemo(() => columns.find((col) => col.isGroup), [columns]);

	const childNodes = useMemo(() => {
		if (!isExpand) {
			return [];
		}
		const children = node.nodes || [];
		if (!multiGroup || groupKeys.length <= 1) {
			return children;
		}
		return groupChildrenForExpand(children, groupKeys, parentLevel, expandKey);
	}, [isExpand, node.nodes, multiGroup, groupKeys, parentLevel, expandKey]);

	const groupedColumn = useMemo(
		() => getGroupedColumnForLevel(columns, groupKeys, parentLevel + 1),
		[columns, groupKeys, parentLevel],
	);

	if (!isExpand || !childNodes.length) {
		return null;
	}

	const resolveChildVisual = (index: number): TableBodyRowProps<T>['groupedVisual'] => {
		if (index === childNodes.length - 1) {
			return 'highlight-last';
		}
		return undefined;
	};

	return (
		<>
			{childNodes.map((child, index) => (
				<TableBodyRow<T>
					key={getNodeExpandKey(child)}
					node={child}
					columns={columns}
					level={level + 1}
					group={group}
					grouped={groupedColumn}
					groupedVisual={resolveChildVisual(index)}
				/>
			))}
		</>
	);
}

function TableBodyGroupedNested<T = object>({
	node,
	columns,
	column: _groupedColumn,
	level = 0,
}: TableBodyGroupedProps<T>) {
	const { props } = useTableDataContext<T>();
	const { groupAt, groupKeys } = useTableGroupingContext<T>();
	const { isExpanded } = useTableExpandContext();

	const parentLevel = node.groupLevel ?? 0;
	const expandKey = getNodeExpandKey(node);
	const isExpand = isExpanded(expandKey, 'grouped');
	const hasChildren = node.isParent && (node.nodes?.length ?? 0) > 0;

	const expandColumn = useMemo(
		() => getGroupedColumnForLevel(columns, groupKeys, parentLevel),
		[columns, groupKeys, parentLevel],
	);

	const nestedColumns = useMemo(
		() => getGroupedNestedColumns(columns, parentLevel, groupKeys),
		[columns, parentLevel, groupKeys],
	);

	const alignedNestedColumns = useMemo(
		() => alignNestedColumnsFromExpander(nestedColumns, expandColumn),
		[nestedColumns, expandColumn],
	);

	const nestedData = useMemo(
		() => (node.nodes ?? []).map((child) => child.data),
		[node.nodes],
	);

	const layout = useMemo(
		() => getNestedExpandLayout(columns, expandColumn ?? columns[0], groupAt),
		[columns, expandColumn, groupAt],
	);

	if (!hasChildren || !isExpand || !expandColumn) {
		return null;
	}

	const Tag = TableData as React.FC<TableDataProps<T>>;

	return (
		<Table.Tr>
			{groupAt === 'start' && layout.padStart > 0 && (
				<Table.Td colSpan={layout.padStart} p="0" aria-hidden />
			)}
			<Table.Td p="0" colSpan={layout.nestedColspan}>
				<Collapse expanded={isExpand} p="0">
					<Tag
						{...(props as TableDataProps<T>)}
						data={nestedData}
						columns={alignedNestedColumns}
						groupKeys={groupKeys}
						groupAt={groupAt}
						groupLayout="grouped-first"
						initialGroupLevel={parentLevel + 1}
						level={level}
						withHeader={false}
						withPagination={false}
					/>
				</Collapse>
			</Table.Td>
			{groupAt === 'end' && layout.padEnd > 0 && (
				<Table.Td colSpan={layout.padEnd} p="0" />
			)}
		</Table.Tr>
	);
}

export function TableBodyGrouped<T = object>(props: TableBodyGroupedProps<T>) {
	const { groupLayout } = useTableGroupingContext<T>();

	if (groupLayout === 'grouped-first') {
		if (!props.column) {
			return null;
		}
		return <TableBodyGroupedNested<T> {...props} />;
	}

	return <TableBodyGroupedInline<T> {...props} />;
}
