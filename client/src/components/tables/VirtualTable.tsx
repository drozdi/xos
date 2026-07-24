import { Spin } from 'antd';
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

const BORDER = '1px solid #f0f0f0';
const HEADER_BG = '#fafafa';
const STRIPE_BG = '#fafafa';
const HOVER_BG = '#f5f5f5';

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
	if (!row) {
		return null;
	}

	const isStriped = striped && index % 2 === 1;

	return (
		<div
			role="row"
			tabIndex={onRowClick ? 0 : undefined}
			style={{
				...style,
				display: 'grid',
				gridTemplateColumns,
				alignItems: 'center',
				borderBottom: BORDER,
				background: isStriped ? STRIPE_BG : undefined,
				cursor: onRowClick ? 'pointer' : undefined,
			}}
			onClick={onRowClick ? () => onRowClick(row, index) : undefined}
			onKeyDown={
				onRowClick
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onRowClick(row, index);
							}
						}
					: undefined
			}
			onMouseEnter={
				highlightOnHover
					? (event) => {
							event.currentTarget.style.background = HOVER_BG;
						}
					: undefined
			}
			onMouseLeave={
				highlightOnHover
					? (event) => {
							event.currentTarget.style.background = isStriped ? STRIPE_BG : '';
						}
					: undefined
			}
		>
			{columns.map((column) => (
				<div
					key={column.key}
					style={{
						padding: '6px 12px',
						textAlign: column.align,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{column.render(row, index)}
				</div>
			))}
		</div>
	);
}

function StaticTableBody<T>({
	columns,
	rows,
	onRowClick,
	getRowKey,
}: Pick<VirtualTableProps<T>, 'columns' | 'rows' | 'onRowClick' | 'getRowKey'>) {
	return (
		<tbody>
			{rows.map((row, index) => (
				<tr
					key={getRowKey?.(row, index) ?? index}
					onClick={onRowClick ? () => onRowClick(row, index) : undefined}
					style={onRowClick ? { cursor: 'pointer' } : undefined}
				>
					{columns.map((column) => (
						<td
							key={column.key}
							style={{ width: column.width, textAlign: column.align, padding: '8px 12px' }}
						>
							{column.render(row, index)}
						</td>
					))}
				</tr>
			))}
		</tbody>
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
			<div style={{ padding: 12, textAlign: 'center' }}>
				<Spin size="small" tip="Загрузка таблицы…" />
			</div>
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
			<table
				style={{
					width: '100%',
					borderCollapse: 'collapse',
					tableLayout: 'fixed',
					border: withTableBorder ? BORDER : undefined,
				}}
			>
				<thead>
					<tr style={{ background: HEADER_BG }}>
						{columns.map((column) => (
							<th
								key={column.key}
								style={{
									width: column.width,
									textAlign: column.align,
									padding: '8px 12px',
									borderBottom: BORDER,
									fontWeight: 600,
								}}
							>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<StaticTableBody
					columns={columns}
					rows={rows}
					onRowClick={onRowClick}
					getRowKey={getRowKey}
				/>
			</table>
		);
	}

	return (
		<div
			style={{
				border: withTableBorder ? BORDER : undefined,
				borderRadius: 6,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns,
					alignItems: 'center',
					background: HEADER_BG,
					borderBottom: BORDER,
					fontWeight: 600,
					fontSize: 14,
				}}
			>
				{columns.map((column) => (
					<div
						key={column.key}
						style={{ padding: '8px 12px', textAlign: column.align }}
					>
						{column.header}
					</div>
				))}
			</div>
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
		</div>
	);
}
