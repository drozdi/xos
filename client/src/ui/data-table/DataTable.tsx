import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Space, Table, type TableColumnsType, type TableProps } from 'antd';
import {
	useCallback,
	useMemo,
	useState,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
} from 'react';

import { confirmAction } from '@/core/confirm/confirmAction';

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
	groupKeys?: (keyof T)[];
	groupedField?: keyof T;
	groupedHeader?: ReactNode;
	groupItemsField?: keyof T;
	groupHeader?: ReactNode;
	defaultGroupedExpanded?: boolean;
	groupedMultiple?: boolean;
}

type RowRecord = object & {
	key: string;
	__group?: boolean;
	__groupLabel?: ReactNode;
	children?: RowRecord[];
};

const PAGE_SIZE_OPTIONS = ['15', '30', '50', '75', '100'];
const WIDTHS_STORAGE_SUFFIX = '.columnWidths';

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

function loadColumnWidths(storageKey: string): Record<string, number> {
	try {
		const raw = localStorage.getItem(`${storageKey}${WIDTHS_STORAGE_SUFFIX}`);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw) as unknown;
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return parsed as Record<string, number>;
		}
	} catch {
		/* ignore corrupt storage */
	}
	return {};
}

function saveColumnWidths(storageKey: string, widths: Record<string, number>): void {
	try {
		localStorage.setItem(`${storageKey}${WIDTHS_STORAGE_SUFFIX}`, JSON.stringify(widths));
	} catch {
		/* quota / private mode */
	}
}

function rowIdentity(row: object, index: number): string {
	const record = row as Record<string, unknown>;
	if (typeof record.id === 'number' || typeof record.id === 'string') {
		return `id:${String(record.id)}`;
	}
	return `idx:${index}`;
}

/**
 * Nested `groupItemsField` → antd tree `children`.
 * `groupKeys` / `groupedField` → synthetic group parents (expandable).
 * If both are absent, rows are flat.
 */
function buildRows<T extends object>(
	data: T[],
	options: {
		groupKeys?: (keyof T)[];
		groupedField?: keyof T;
		groupItemsField?: keyof T;
		groupedHeader?: ReactNode;
		groupHeader?: ReactNode;
	},
): { rows: RowRecord[]; groupingNote?: string } {
	const { groupKeys, groupedField, groupItemsField, groupedHeader, groupHeader } = options;

	if (groupItemsField) {
		const field = String(groupItemsField);
		const rows = data.map((row, index) => {
			const record = row as Record<string, unknown>;
			const nested = record[field];
			const base: RowRecord = {
				...(row as object),
				key: rowIdentity(row, index),
			};
			if (Array.isArray(nested) && nested.length > 0) {
				base.children = (nested as object[]).map((child, childIndex) => ({
					...child,
					key: `${base.key}:child:${rowIdentity(child, childIndex)}`,
				}));
			}
			return base;
		});
		return {
			rows,
			groupingNote: groupHeader
				? undefined
				: 'groupItemsField mapped to antd Table tree children',
		};
	}

	const keys = groupKeys?.length
		? groupKeys
		: groupedField
			? [groupedField]
			: undefined;

	if (!keys?.length) {
		return {
			rows: data.map((row, index) => ({
				...(row as object),
				key: rowIdentity(row, index),
			})),
		};
	}

	const labelField = groupedField ?? keys[0]!;
	const groups = new Map<string, { label: ReactNode; items: T[] }>();

	for (const row of data) {
		const groupValue = keys.map((key) => String(row[key] ?? '')).join('|');
		const label = groupedField
			? (row[groupedField] as ReactNode)
			: (row[labelField] as ReactNode);
		const existing = groups.get(groupValue);
		if (existing) {
			existing.items.push(row);
		} else {
			groups.set(groupValue, {
				label: label ?? groupValue,
				items: [row],
			});
		}
	}

	const rows: RowRecord[] = [];
	let groupIndex = 0;
	for (const [groupValue, group] of groups) {
		const children = group.items.map((row, index) => ({
			...(row as object),
			key: `g:${groupValue}:${rowIdentity(row, index)}`,
		}));
		rows.push({
			key: `group:${groupValue}:${groupIndex}`,
			__group: true,
			__groupLabel: group.label,
			children,
		} as RowRecord);
		groupIndex += 1;
	}

	return {
		rows,
		groupingNote: `Grouped by ${keys.map(String).join(', ')} via expandable parents${
			groupedHeader ? ` (${String(groupedHeader)})` : ''
		}`,
	};
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
	groupKeys,
	groupedField,
	groupedHeader,
	groupItemsField,
	groupHeader,
	defaultGroupedExpanded = false,
	groupedMultiple: _groupedMultiple = false,
}: DataTableProps<T>) {
	void _groupedMultiple;
	const showEdit = Boolean(onEdit && canEdit);
	const showDelete = Boolean(onDelete && canDelete);
	const hasActions = showEdit || showDelete;

	const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
		loadColumnWidths(storageKey),
	);

	const { rows: treeRows } = useMemo(
		() =>
			buildRows(data, {
				groupKeys,
				groupedField,
				groupItemsField,
				groupedHeader,
				groupHeader,
			}),
		[data, groupKeys, groupedField, groupItemsField, groupedHeader, groupHeader],
	);

	const displayData = useMemo(() => {
		if (serverPagination || !withPagination || limit <= 0) {
			return treeRows;
		}
		const start = (Math.max(1, page) - 1) * limit;
		return treeRows.slice(start, start + limit);
	}, [treeRows, serverPagination, withPagination, limit, page]);

	const paginationTotal = serverPagination ? (total ?? data.length) : treeRows.length;

	const handleResize = useCallback(
		(field: string, width: number) => {
			setColumnWidths((prev) => {
				const next = { ...prev, [field]: width };
				saveColumnWidths(storageKey, next);
				return next;
			});
		},
		[storageKey],
	);

	const antdColumns = useMemo<TableColumnsType<RowRecord>>(() => {
		const cols: TableColumnsType<RowRecord> = columns.map((column) => {
			const field = String(column.field);
			const width = columnWidths[field] ?? column.width;

			return {
				title: column.header,
				dataIndex: field,
				key: field,
				width,
				align: column.align,
				sorter: column.sortable
					? (a, b) => {
							if (a.__group || b.__group) {
								return 0;
							}
							const av = (a as Record<string, unknown>)[field];
							const bv = (b as Record<string, unknown>)[field];
							if (av == null && bv == null) {
								return 0;
							}
							if (av == null) {
								return -1;
							}
							if (bv == null) {
								return 1;
							}
							if (typeof av === 'number' && typeof bv === 'number') {
								return av - bv;
							}
							return String(av).localeCompare(String(bv), 'ru');
						}
					: undefined,
				onHeaderCell: column.resizable
					? () => ({
							style: { cursor: 'col-resize' },
							onMouseDown: (event: ReactMouseEvent) => {
								const startX = event.clientX;
								const startWidth = width ?? 120;
								const onMove = (moveEvent: MouseEvent) => {
									handleResize(field, Math.max(48, startWidth + moveEvent.clientX - startX));
								};
								const onUp = () => {
									window.removeEventListener('mousemove', onMove);
									window.removeEventListener('mouseup', onUp);
								};
								window.addEventListener('mousemove', onMove);
								window.addEventListener('mouseup', onUp);
							},
						})
					: undefined,
				render: (_value, record) => {
					if (record.__group) {
						if (column.field === (groupedField ?? groupKeys?.[0])) {
							return record.__groupLabel ?? '';
						}
						return null;
					}
					return renderCellValue(record as T, column);
				},
			};
		});

		if (hasActions) {
			cols.push({
				title: 'Действия',
				key: '_actions',
				width: 88,
				align: 'center',
				fixed: 'right',
				render: (_value, record) => {
					if (record.__group) {
						return null;
					}
					const row = record as T;
					return (
						<Space size={0} onClick={(event) => event.stopPropagation()}>
							{showEdit && onEdit ? (
								<Button
									type="text"
									size="small"
									icon={<EditOutlined />}
									aria-label="Редактировать"
									onClick={() => void onEdit(row)}
								/>
							) : null}
							{showDelete && onDelete ? (
								<Button
									type="text"
									size="small"
									danger
									icon={<DeleteOutlined />}
									aria-label="Удалить"
									onClick={() => {
										const label = getRowLabel(row);
										confirmAction({
											title: 'Удаление',
											message: `Удалить «${label}»? Это действие нельзя отменить.`,
											confirmLabel: 'Удалить',
											confirmColor: 'red',
											onConfirm: () => onDelete(row),
										});
									}}
								/>
							) : null}
						</Space>
					);
				},
			});
		}

		return cols;
	}, [
		columns,
		columnWidths,
		groupedField,
		groupKeys,
		handleResize,
		hasActions,
		showEdit,
		showDelete,
		onEdit,
		onDelete,
		getRowLabel,
	]);

	const onRow: TableProps<RowRecord>['onRow'] = onRowClick
		? (record) => ({
				onClick: () => {
					if (record.__group) {
						return;
					}
					onRowClick(record as T);
				},
				style: { cursor: 'pointer' },
			})
		: undefined;

	const expandable = useMemo(() => {
		const hasTree = displayData.some((row) => Array.isArray(row.children) && row.children.length > 0);
		if (!hasTree) {
			return undefined;
		}
		return {
			defaultExpandAllRows: defaultGroupedExpanded,
			childrenColumnName: 'children' as const,
		};
	}, [displayData, defaultGroupedExpanded]);

	return (
		<Flex
			vertical
			style={{
				flex: 1,
				minHeight: 0,
				overflow: 'hidden',
				width: '100%',
			}}
		>
			{error ? (
				<Alert type="error" showIcon message={error} style={{ marginBottom: 8 }} />
			) : null}
			<Table<RowRecord>
				size="small"
				rowKey="key"
				columns={antdColumns}
				dataSource={error ? [] : displayData}
				loading={loading}
				locale={{ emptyText: noDataText }}
				onRow={onRow}
				expandable={expandable}
				scroll={{ y: minHeight, x: 'max-content' }}
				pagination={
					withPagination
						? {
								current: page,
								pageSize: limit,
								total: paginationTotal,
								showSizeChanger: true,
								pageSizeOptions: PAGE_SIZE_OPTIONS,
								onChange: (nextPage, nextSize) => {
									onPageChange?.(nextPage);
									if (typeof nextSize === 'number' && nextSize !== limit) {
										onLimitChange?.(nextSize);
									}
								},
							}
						: false
				}
				style={{ flex: 1, minHeight: 0 }}
			/>
		</Flex>
	);
}
