import { Box, Table, type TableTrProps } from '@mantine/core';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import type { ListProps, RowComponentProps } from 'react-window';

export interface VirtualTableColumn<T> {
	key: string;
	header: ReactNode;
	width?: string | number;
	align?: 'left' | 'center' | 'right';
	render: (row: T, index: number) => ReactNode;
}

export interface VirtualTableProps<T> {
	columns: VirtualTableColumn<T>[];
	rows: T[];
	rowHeight?: number;
	height?: number;
	virtualizationThreshold?: number;
	onRowClick?: (row: T, index: number) => void;
	getRowKey?: (row: T, index: number) => string | number;
	striped?: boolean;
	highlightOnHover?: boolean;
	withTableBorder?: boolean;
}

interface VirtualRowProps<T> {
	columns: VirtualTableColumn<T>[];
	rows: T[];
	gridTemplateColumns: string;
	onRowClick?: (row: T, index: number) => void;
	striped?: boolean;
	highlightOnHover?: boolean;
}

function VirtualTableRow<T>({
	index,
	style,
	columns,
	rows,
	gridTemplateColumns,
	onRowClick,
	striped,
	highlightOnHover,
}: RowComponentProps<VirtualRowProps<T>>) {
	const row = rows[index];
	if (!row) {return null;}

	const isStriped = striped && index % 2 === 1;

	return (
		<Box
			{...{ role: 'row' }}
			style={{
				...style,
				display: 'grid',
				gridTemplateColumns,
				alignItems: 'center',
				borderBottom: '1px solid var(--mantine-color-gray-3)',
				background: isStriped ? 'var(--mantine-color-gray-0)' : undefined,
				cursor: onRowClick ? 'pointer' : undefined,
			}}
			onClick={onRowClick ? () => onRowClick(row, index) : undefined}
			onMouseEnter={
				highlightOnHover
					? (event) => {
							event.currentTarget.style.background = 'var(--mantine-color-gray-1)';
						}
					: undefined
			}
			onMouseLeave={
				highlightOnHover
					? (event) => {
							event.currentTarget.style.background = isStriped
								? 'var(--mantine-color-gray-0)'
								: '';
						}
					: undefined
			}
		>
			{columns.map((column) => (
				<Box
					key={column.key}
					px="sm"
					py={6}
					style={{ textAlign: column.align, overflow: 'hidden', textOverflow: 'ellipsis' }}
				>
					{column.render(row, index)}
				</Box>
			))}
		</Box>
	);
}

function StaticTableBody<T>({
	columns,
	rows,
	onRowClick,
	getRowKey,
}: Pick<VirtualTableProps<T>, 'columns' | 'rows' | 'onRowClick' | 'getRowKey'>) {
	return (
		<Table.Tbody>
			{rows.map((row, index) => {
				const rowProps: TableTrProps = onRowClick
					? { onClick: () => onRowClick(row, index), style: { cursor: 'pointer' } }
					: {};

				return (
					<Table.Tr key={getRowKey?.(row, index) ?? index} {...rowProps}>
						{columns.map((column) => (
							<Table.Td
								key={column.key}
								style={{ width: column.width, textAlign: column.align }}
							>
								{column.render(row, index)}
							</Table.Td>
						))}
					</Table.Tr>
				);
			})}
		</Table.Tbody>
	);
}

interface VirtualListBodyProps<T> extends VirtualRowProps<T> {
	rowHeight: number;
	height: number;
}

function VirtualListBody<T>({
	columns,
	rows,
	rowHeight,
	height,
	gridTemplateColumns,
	onRowClick,
	striped,
	highlightOnHover,
}: VirtualListBodyProps<T>) {
	const [ListComponent, setListComponent] = useState<
		typeof import('react-window').List | null
	>(null);

	useEffect(() => {
		let cancelled = false;
		void import('react-window').then((mod) => {
			if (!cancelled) {
				setListComponent(() => mod.List);
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const listStyle: CSSProperties = {
		height,
		width: '100%',
	};

	const rowProps = {
		columns,
		rows,
		gridTemplateColumns,
		onRowClick,
		striped,
		highlightOnHover,
	};

	if (!ListComponent) {
		return (
			<Box p="sm" c="dimmed" fz="sm">
				Загрузка таблицы…
			</Box>
		);
	}

	const listProps = {
		rowCount: rows.length,
		rowHeight,
		rowProps,
		rowComponent: VirtualTableRow<T>,
		style: listStyle,
		overscanCount: 8,
	} satisfies Partial<ListProps<VirtualRowProps<T>>>;

	return <ListComponent {...listProps} />;
}

function buildGridTemplateColumns<T>(columns: VirtualTableColumn<T>[]): string {
	return columns.map((column) => (column.width ? String(column.width) : '1fr')).join(' ');
}

export function VirtualTable<T>({
	columns,
	rows,
	rowHeight = 36,
	height = 400,
	virtualizationThreshold = 100,
	onRowClick,
	getRowKey,
	striped = true,
	highlightOnHover = true,
	withTableBorder = true,
}: VirtualTableProps<T>) {
	const useVirtual = rows.length > virtualizationThreshold;
	const gridTemplateColumns = buildGridTemplateColumns(columns);

	if (!useVirtual) {
		return (
			<Table
				striped={striped}
				highlightOnHover={highlightOnHover}
				withTableBorder={withTableBorder}
				layout="fixed"
			>
				<Table.Thead>
					<Table.Tr>
						{columns.map((column) => (
							<Table.Th
								key={column.key}
								style={{ width: column.width, textAlign: column.align }}
							>
								{column.header}
							</Table.Th>
						))}
					</Table.Tr>
				</Table.Thead>
				<StaticTableBody
					columns={columns}
					rows={rows}
					onRowClick={onRowClick}
					getRowKey={getRowKey}
				/>
			</Table>
		);
	}

	const borderStyle = withTableBorder
		? '1px solid var(--mantine-color-gray-4)'
		: undefined;

	return (
		<Box
			style={{
				border: borderStyle,
				borderRadius: 'var(--mantine-radius-default)',
				overflow: 'hidden',
			}}
		>
			<Box
				style={{
					display: 'grid',
					gridTemplateColumns,
					alignItems: 'center',
					background: 'var(--mantine-color-gray-1)',
					borderBottom: '1px solid var(--mantine-color-gray-3)',
					fontWeight: 600,
					fontSize: 'var(--mantine-font-size-sm)',
				}}
			>
				{columns.map((column) => (
					<Box
						key={column.key}
						px="sm"
						py="xs"
						style={{ textAlign: column.align }}
					>
						{column.header}
					</Box>
				))}
			</Box>
			<VirtualListBody
				columns={columns}
				rows={rows}
				rowHeight={rowHeight}
				height={height}
				gridTemplateColumns={gridTemplateColumns}
				onRowClick={onRowClick}
				striped={striped}
				highlightOnHover={highlightOnHover}
			/>
		</Box>
	);
}
