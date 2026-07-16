import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { DataColumn } from './DataColumn';
import { TableData } from './TableData';

export interface DataTableColumn<T> {
	field: keyof T;
	header: ReactNode;
	width?: number;
	sortable?: boolean;
	resizable?: boolean;
	align?: 'left' | 'right' | 'center';
	render?: (row: T) => ReactNode;
}

export interface DataTableProps<T extends object> {
	columns: DataTableColumn<T>[];
	data: T[];
	storageKey: string;
	onRowClick?: (row: T) => void;
	loading?: boolean;
	error?: ReactNode;
	minHeight?: number;
	noDataText?: string;
	withPagination?: boolean;
	limit?: number;
}

function renderCellValue<T extends object>(row: T, column: DataTableColumn<T>): ReactNode {
	if (column.render) {
		return column.render(row);
	}

	const value = row[column.field];
	if (value == null) {
		return '';
	}

	return String(value);
}

function ClickableCell<T extends object>({
	row,
	column,
	onRowClick,
}: {
	row: T;
	column: DataTableColumn<T>;
	onRowClick?: (row: T) => void;
}) {
	const content = renderCellValue(row, column);

	if (!onRowClick) {
		return content;
	}

	return (
		<span
			role="button"
			tabIndex={0}
			style={{ display: 'block', cursor: 'pointer' }}
			onClick={() => onRowClick(row)}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onRowClick(row);
				}
			}}
		>
			{content}
		</span>
	);
}

export function DataTable<T extends object>({
	columns,
	data,
	storageKey,
	onRowClick,
	loading = false,
	error,
	minHeight = 360,
	noDataText = 'Нет записей',
	withPagination = false,
	limit = 50,
}: DataTableProps<T>) {
	const bodyStyle = useMemo(
		() => (onRowClick ? { cursor: 'pointer' as const } : undefined),
		[onRowClick],
	);

	return (
		<TableData<T>
			data={data}
			storage={storageKey}
			loading={loading}
			error={error}
			minHeight={minHeight}
			noDataText={noDataText}
			withPagination={withPagination}
			limit={limit}
		>
			{columns.map((column) => (
				<DataColumn<T>
					key={String(column.field)}
					field={column.field}
					header={column.header}
					width={column.width}
					sortable={column.sortable ?? true}
					resizable={column.resizable ?? true}
					align={column.align}
					bodyStyle={bodyStyle}
					body={(row: T) => (
						<ClickableCell row={row} column={column} onRowClick={onRowClick} />
					)}
				/>
			))}
		</TableData>
	);
}
