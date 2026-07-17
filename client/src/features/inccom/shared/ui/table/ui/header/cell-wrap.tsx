import { Table } from '@mantine/core';
import { useMemo } from 'react';
import { useTableColumnSizingContext } from '../../context';
import {
	isGroupOnlyExpanderColumn,
	TABLE_EXPANDER_COLUMN_WIDTH,
} from '../../utils/column-fields';
import type { TableHeaderCellWrapProps } from '../type';
import { useColumnDrag } from './use-column-drag';

export { useColumnDrag } from './use-column-drag';

export function TableHeaderCellWrap<T = object>({
	column,
	maxCol,
	maxRow,
	children,
	className,
}: TableHeaderCellWrapProps<T>) {
	const { getColumnWidth } = useTableColumnSizingContext<T>();
	const rowspan = column.isColumns ? 1 : maxRow - column.parentLevel;
	const dragProps = useColumnDrag<T>(column);

	const headerStyle = useMemo(() => {
		return typeof column.headerStyle === 'function'
			? column.headerStyle(column)
			: column.headerStyle || {};
	}, [column]);

	const isGroupOnlyExpander = isGroupOnlyExpanderColumn(column);
	const storedWidth = getColumnWidth(column);
	const expanderWidth = storedWidth ?? TABLE_EXPANDER_COLUMN_WIDTH;

	return (
		<Table.Th
			className={className}
			pos="relative"
			colSpan={column.colspan}
			rowSpan={rowspan}
			w={
				column.isHoverSlot
					? 0
					: column.isSelecting
						? (storedWidth ?? 44)
						: isGroupOnlyExpander
							? expanderWidth
							: storedWidth
			}
			miw={isGroupOnlyExpander ? TABLE_EXPANDER_COLUMN_WIDTH : undefined}
			maw={isGroupOnlyExpander && storedWidth == null ? TABLE_EXPANDER_COLUMN_WIDTH : undefined}
			style={{
				...headerStyle,
				backgroundColor: dragProps.bg ?? headerStyle.backgroundColor,
			}}
			role="columnheader"
			{...(dragProps.draggable ? dragProps : {})}
		>
			{children}
		</Table.Th>
	);
}
