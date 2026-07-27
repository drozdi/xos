import { Table } from '@mantine/core';
import { useMemo } from 'react';
import { getHeaderCellKey } from '../../utils/column-fields';
import { useTableDataContext } from '../../context/TableDataContext';
import type { ColumnEntity } from '../../type';
import type { TableHeaderProps } from '../type';
import { TableHeaderCell } from './cell';

export * from './bulk-actions';
export * from './hover-slot-cell';
export * from './actions-cell';
export * from './cell';
export * from './cell-drager';
export * from './cell-expander';
export * from './cell-resizer';
export * from './cell-slot';
export * from './cell-sorter';
export * from './cell-toggler';
export * from './cell-wrap';
export * from './group';
export * from './selector';

function shouldRenderHeaderCell<T>(column: ColumnEntity<T>): boolean {
	return (
		column.isGrouped ||
		column.isGroup ||
		column.isHeader ||
		column.isSelecting ||
		column.isActions ||
		column.isHoverSlot
	);
}

export function TableHeader<T = object>({ columns }: TableHeaderProps<T>) {
	const { rowspan, colspan } = useTableDataContext<T>();

	const rows = useMemo(() => {
		const result: React.ReactNode[][] = [];

		function pushCell(column: ColumnEntity<T>, level: number) {
			if (!result[level]) {
				result[level] = [];
			}
			result[level]!.push(
				<TableHeaderCell<T>
					key={getHeaderCellKey(column)}
					maxRow={rowspan}
					maxCol={colspan}
					column={column}
				/>,
			);
		}

		function processColumns(cols: ColumnEntity<T>[], level: number) {
			for (const column of cols) {
				if (column.isColumns && column.isHeader) {
					processColumns(column.columns, level + 1);
					if (shouldRenderHeaderCell(column)) {
						pushCell(column, level);
					}
					continue;
				}

				if (column.isColumns) {
					for (const child of column.columns) {
						if (shouldRenderHeaderCell(child)) {
							pushCell(child, level);
						}
					}
					continue;
				}

				if (shouldRenderHeaderCell(column)) {
					pushCell(column, level);
				}
			}
		}

		processColumns(columns, 0);
		return result;
	}, [columns, rowspan, colspan]);

	return rows.map((row, index) => (
		<Table.Tr key={index} role="row">
			{row}
		</Table.Tr>
	));
}
