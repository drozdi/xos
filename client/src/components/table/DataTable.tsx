import { Box } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { confirmAction } from '@/core/confirm/confirmAction';

import { DataColumn } from './DataColumn';
import { TableData } from './TableData';
import type { TableRowAction } from './type';

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
	onEdit?: (row: T) => void | Promise<void>;
	onDelete?: (row: T) => void | Promise<void>;
	canEdit?: boolean;
	canDelete?: boolean;
	getRowLabel?: (row: T) => string;
	loading?: boolean;
	error?: ReactNode;
	minHeight?: number;
	noDataText?: string;
	withPagination?: boolean;
	limit?: number;
	page?: number;
	total?: number;
	serverPagination?: boolean;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
}

function defaultRowLabel<T extends object>(row: T): string {
	const record = row as Record<string, unknown>;
	const name = record.name ?? record.code ?? record.login ?? record.alias;
	if (typeof name === 'string' && name.length > 0) {
		return name;
	}
	if (typeof record.id === 'number') {
		return `#${record.id}`;
	}
	return 'запись';
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
	onEdit,
	onDelete,
	canEdit = true,
	canDelete = true,
	getRowLabel = defaultRowLabel,
	loading = false,
	error,
	minHeight = 360,
	noDataText = 'Нет записей',
	withPagination = true,
	limit = 50,
	page = 1,
	total,
	serverPagination = false,
	onPageChange,
	onLimitChange,
}: DataTableProps<T>) {
	const showEdit = Boolean(onEdit && canEdit);
	const showDelete = Boolean(onDelete && canDelete);
	const hasActions = showEdit || showDelete;

	const rowActions = useMemo<TableRowAction<T>[]>(() => {
		const actions: TableRowAction<T>[] = [];

		if (showEdit && onEdit) {
			actions.push({
				id: 'edit',
				label: 'Редактировать',
				icon: <IconPencil size={16} />,
				onClick: (item) => onEdit(item),
			});
		}

		if (showDelete && onDelete) {
			actions.push({
				id: 'delete',
				label: 'Удалить',
				color: 'red',
				icon: <IconTrash size={16} />,
				onClick: (item) => {
					const label = getRowLabel(item);
					confirmAction({
						title: 'Удаление',
						message: `Удалить «${label}»? Это действие нельзя отменить.`,
						confirmLabel: 'Удалить',
						confirmColor: 'red',
						onConfirm: () => onDelete(item),
					});
				},
			});
		}

		return actions;
	}, [getRowLabel, onDelete, onEdit, showDelete, showEdit]);

	const bodyStyle = useMemo(
		() => (onRowClick ? { cursor: 'pointer' as const } : undefined),
		[onRowClick],
	);

	return (
		<Box
			style={{
				flex: 1,
				minHeight: 0,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			<TableData<T>
			data={data}
			storage={storageKey}
			loading={loading}
			error={error}
			minHeight={minHeight}
			noDataText={noDataText}
			withPagination={withPagination}
			limit={limit}
			page={page}
			total={total}
			serverPagination={serverPagination}
			onPageChange={onPageChange}
			onLimitChange={onLimitChange}
			rowActions={hasActions ? rowActions : undefined}
			rowActionsOnHover={false}
		>
			{columns.map((column) => (
				<DataColumn<T>
					key={String(column.field)}
					field={column.field}
					header={column.header}
					width={column.width}
					sortable={column.sortable ?? true}
					resizable={column.resizable ?? false}
					align={column.align}
					bodyStyle={bodyStyle}
					body={(row: T) => (
						<ClickableCell row={row} column={column} onRowClick={onRowClick} />
					)}
				/>
			))}
			{hasActions ? (
				<DataColumn<T>
					field={'_actions' as keyof T}
					header="Действия"
					align="center"
					actions
					actionsAt="end"
					width={88}
					sortable={false}
					resizable={false}
					toggleable={false}
					draggable={false}
				/>
			) : null}
		</TableData>
		</Box>
	);
}
