import { Group, Table } from "@mantine/core";
import { memo, useMemo } from 'react';
import { useTableColumnSizingContext, useTableGroupingContext } from '../../context';
import type { TableNode } from '../../type';
import {
	isGroupOnlyExpanderColumn,
	TABLE_EXPANDER_COLUMN_WIDTH,
} from '../../utils/column-fields';
import {
	appliesGroupedCellPadding,
	getGroupedCellPaddingForRow,
	getGroupedColumnLevel,
	getGroupedColumnPadding,
	getNestedRowPaddingSteps,
	getGroupedPaddingBySteps,
	isUnifiedGroupColumn,
	resolveRowGroupLevel,
	toGroupedPaddingStyle,
} from '../../utils/group-by';
import type { TableBodyCellWrapProps } from '../type';

export const TableBodyCellWrap = memo(function TableBodyCellWrap<T = object>({
	node,
	column,
	columns,
	columnIndex,
	onClick,
	children,
	className,
	plain = false,
}: TableBodyCellWrapProps<T>) {
	const { groupKeys, groupLevel: tableNestLevel, groupLayout, groupAt } = useTableGroupingContext<T>();
	const { getColumnWidth } = useTableColumnSizingContext<T>();

	const { tdStyle, groupedContentStyle } = useMemo(() => {
		const baseStyle =
			typeof column.bodyStyle === 'function'
				? column.bodyStyle?.(column, node as TableNode<T>)
				: column.bodyStyle || {};

		let groupedPadding: string | undefined;
		if (appliesGroupedCellPadding(groupLayout, tableNestLevel)) {
			const rowGroupLevel = resolveRowGroupLevel(node, groupKeys, columns ?? [], tableNestLevel);
			if (columns !== undefined && columnIndex !== undefined && rowGroupLevel >= 0) {
				groupedPadding = getGroupedCellPaddingForRow(
					node,
					column,
					columnIndex,
					columns,
					groupKeys,
					rowGroupLevel,
					tableNestLevel,
					groupAt,
				);
			} else if (isUnifiedGroupColumn(column)) {
				groupedPadding = undefined;
			} else if (column.isGrouped) {
				groupedPadding = getGroupedColumnPadding<T>(column, getGroupedColumnLevel(column, groupKeys));
			}

			if (
				!groupedPadding &&
				!column.isGroup &&
				!column.isGrouped &&
				!column.isSelecting &&
				!column.isActions &&
				!column.isHoverSlot
			) {
				groupedPadding = getGroupedPaddingBySteps(getNestedRowPaddingSteps(node));
			}
		}

		return {
			tdStyle: baseStyle,
			groupedContentStyle: toGroupedPaddingStyle(groupedPadding),
		};
	}, [column, columns, columnIndex, groupAt, groupKeys, groupLayout, node, tableNestLevel]);

	const hasGroupedContentStyle = Object.keys(groupedContentStyle).length > 0;

	const content = useMemo(() => {
		if (!children) {
			return null;
		}
		if (column.isHoverSlot || column.isSelecting) {
			return children;
		}
		if (plain) {
			if (!hasGroupedContentStyle) {
				return children;
			}
			return (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						width: '100%',
						...groupedContentStyle,
					}}
				>
					{children}
				</div>
			);
		}
		return (
			<Group
				justify="flex-start"
				align="center"
				grow
				style={hasGroupedContentStyle ? { width: '100%', ...groupedContentStyle } : undefined}
			>
				{children}
			</Group>
		);
	}, [children, column.isHoverSlot, column.isSelecting, groupedContentStyle, hasGroupedContentStyle, plain]);

	const isGroupOnlyExpander = isGroupOnlyExpanderColumn(column);
	const storedWidth = getColumnWidth(column);
	const expanderWidth = storedWidth ?? TABLE_EXPANDER_COLUMN_WIDTH;
	const bodyColspan = column.isFieldSplit ? column.colspan : undefined;

	return (
		<Table.Td
			className={className}
			onClick={onClick}
			style={tdStyle}
			colSpan={bodyColspan}
			w={
				column.isHoverSlot
					? 0
					: column.isSelecting
						? 44
						: isGroupOnlyExpander
							? expanderWidth
							: undefined
			}
			miw={isGroupOnlyExpander ? TABLE_EXPANDER_COLUMN_WIDTH : undefined}
			maw={isGroupOnlyExpander && storedWidth == null ? TABLE_EXPANDER_COLUMN_WIDTH : undefined}
			align={column.isSelecting ? 'center' : column.align}
		>
			{content}
		</Table.Td>
	);
}) as <T = object>(props: TableBodyCellWrapProps<T>) => React.ReactNode;
