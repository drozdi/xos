import { Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMounted } from '@mantine/hooks';
import { Children, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBreakpoint } from '../../hooks';
import { Loading } from '../loading';
import { TableColumnMetaProvider } from './context/TableColumnMetaContext';
import { TableColumnSizingProvider } from './context/TableColumnSizingContext';
import { TableDataProvider } from './context/TableDataContext';
import { TableEditProvider } from './context/TableEditContext';
import { TableExpandProvider } from './context/TableExpandContext';
import { TableGroupingProvider } from './context/TableGroupingContext';
import { TableRowActionsProvider } from './context/TableRowActionsContext';
import { TableSelectionProvider } from './context/TableSelectionContext';
import { TableSortProvider } from './context/TableSortContext';
import { useColumnHidden, useColumnOrder, useColumnSort, useNodeSelect } from './hooks';
import type {
	ColumnEntity,
	DataColumnProps,
	ExpandKind,
	TableDataProps,
	TableExpandablesState,
	TableExpandsState,
	TableNode,
	TableStorage,
	ToggleExpandOptions,
} from './type';
import { Table, TableBodyCellSlot, TableEmpty, TableHeaderCellSlot, TablePagination } from "./ui";
import { TableBulkActionsPanel, TableRowActionsPanel } from './ui/row-actions/panel';
import { TableError } from './ui/TableError';
import { calculateColspan, calculateIsColumns, convertNodes, getColumnFields, groupByFirstKey, limitBy, purgeRemovedColumnStorage, resolveColumnFlag, sortByRules } from './utils';
import { calculateTableColspan, findColumnDeep, findGroupColumn, findGroupOnlyColumn, getHeaderCellKey, isFieldSplitColumn, orderColumnsTree } from './utils/column-fields';
import { buildColumnOrderIndex } from './utils/column-order-index';
import {
	appliesTopLevelGrouping,
	buildDataColumns,
	canExpandGroupedNode,
	getNodeExpandKey,
	hasGroupNestedData,
	isGroupAtStart,
	isGroupContainerRow,
	resolveGroupLayout,
} from './utils/group-by';

function genStorage(storageKey: string): TableStorage {
	const prefix = `${storageKey}.`;

	function keyStorage(key: string): string {
		return `${prefix}${key}`;
	}

	return {
		clear() {
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(prefix)) {
					keysToRemove.push(key);
				}
			}
			for (const key of keysToRemove) {
				localStorage.removeItem(key);
			}
		},
		setItem(key, value) {
			localStorage.setItem(keyStorage(key), JSON.stringify(value));
		},
		getItem(key) {
			const value = localStorage.getItem(keyStorage(key));
			if (value) {
				return JSON.parse(value);
			}
			return value;
		},
		removeItem(key) {
			localStorage.removeItem(keyStorage(key));
		},
	};
}

function createSelectColumn<T>(): ColumnEntity<T> {
	return {
		field: '__select__' as keyof T,
		isSelecting: true,
		size: 1,
		level: 0,
		parentLevel: 0,
		columns: [],
		isDraggable: false,
		isGroup: false,
		isGrouped: false,
		isSorted: false,
		isColumns: false,
		isHeader: false,
		isField: false,
		isEmpty: true,
		isToggleable: false,
		isResizable: false,
		isActions: false,
		isHoverSlot: false,
		colspan: 1,
		isFieldSplit: false,
		width: 44,
		align: 'center',
	};
}

function createHoverSlotColumn<T>(at: 'start' | 'end'): ColumnEntity<T> {
	return {
		field: '__hover_slot__' as keyof T,
		isHoverSlot: true,
		isHeader: true,
		isField: false,
		isEmpty: true,
		isSelecting: false,
		isActions: false,
		isDraggable: false,
		isGroup: false,
		isGrouped: false,
		isSorted: false,
		isColumns: false,
		isToggleable: false,
		isResizable: false,
		size: 1,
		level: 1,
		parentLevel: 0,
		columns: [],
		colspan: 1,
		isFieldSplit: false,
		actionsAt: at,
		width: 0,
		align: 'center',
	};
}

export function TableData<T = object>({
	breakpoint: initialBreakpoint,
	storage: initialStorage,
	columns: initialColumns,
	multiple: initialMultiple,

	limits: initialLimits = [15, 30, 50, 75, 100],
	limit: initialLimit = initialLimits[0] || 15,
	page: initialPage = 1,

	columnOrder: initialColumnOrder,
	onColumnOrder: onInitialColumnOrder,

	hiddenColumns: initialHiddenColumns,
	onToggleColumn: onInitialHiddenColumns,

	columnWidths: initialColumnWidth,
	onColumnResize: onInitialColumnResize,

	selectable: initialSelectable,
	selectedRows: initialSelectedRows,
	onSelectedRowsChange: onInitialSelectedRowsChange,

	data: initialData,
	total: initialTotal,
	loading: initialLoading,
	error: initialError,
	withHeader = true,
	withPagination = true,
	groupAt = 'start',
	groupKeys: initialGroupKeys,
	sortKey,
	sortDesc = false,
	multiSort: initialMultiSort,
	sortRules: initialSortRules,
	multiGroup: initialMultiGroup,
	groupLayout: initialGroupLayout,
	initialGroupLevel = 0,
	groupedHighlightLastRow = false,

	////////

	children,
	layout: Layout = ({ nodes, columns }) => (
		<SimpleGrid cols={2}>
			{nodes.map((node) => (
				<Card key={node.index} withBorder>
					{columns
						.filter((column) => column.isField)
						.map((column) => (
							<Group
								key={column.field as string}
								align="flex-end"
								justify="space-between"
								grow
								style={{
									borderBottom: '1px dashed var(--mantine-color-default-border)',
								}}
							>
								<TableHeaderCellSlot<T> column={column} />
								<Text flex={0} fw={600}>
									<TableBodyCellSlot<T> node={node} column={column} />
								</Text>
							</Group>
						))}
				</Card>
			))}
		</SimpleGrid>
	),
	minHeight,
	pagination: Pagination = TablePagination,
	onRowEditComplete,
	editMode,
	rowActions: initialRowActions,
	rowActionsPanel: initialRowActionsPanel = TableRowActionsPanel,
	rowActionsOnHover: initialRowActionsOnHover,
	rowActionsAt: initialRowActionsAt = 'end',
	bulkActions: initialBulkActions,
	bulkActionsPanel: initialBulkActionsPanel = TableBulkActionsPanel,
	noDataText = 'No records',
	level = 0,
	...other
}: TableDataProps<T>) {
	const selectColumn = useMemo(() => createSelectColumn<T>(), []);
	const mounted = useMounted();
	const matchesBreakpoint = useBreakpoint(initialBreakpoint ?? 'xs');
	const breakpoint = !!initialBreakpoint && matchesBreakpoint;
	const fetcher = typeof initialData === 'function';
	const storage = useMemo<TableStorage | undefined>(() => {
		if (!initialStorage) {
			return undefined;
		}
		if (typeof initialStorage === 'string') {
			return genStorage(initialStorage);
		}
		return initialStorage;
	}, [initialStorage]);

	const props = useMemo(
		() => ({
			striped: true,
			highlightOnHover: true,
			horizontalSpacing: '0.5rem',
			verticalSpacing: '0.5rem',
			...other,
		}),
		[other],
	);
	const [limit, setLimit] = useState(initialLimit);
	const [page, setPage] = useState<number | string | undefined>(initialPage);
	const [next, setNext] = useState<string | number>('');
	const [history, setHistory] = useState<(string | number)[]>([]);

	const [data, setData] = useState<T[]>(Array.isArray(initialData) ? initialData : []);
	const [total, setTotal] = useState<number>(initialTotal || data?.length);
	const [totalPage, setTotalPage] = useState(Math.ceil(total / limit));

	const [fetchError, setFetchError] = useState<React.ReactNode>(undefined);
	const [isLoading, setLoading] = useState<boolean>(false);
	const [expands, setExpands] = useState<TableExpandsState>({
		group: [],
		grouped: [],
	});

	const [editableMeta, setEditableMeta] = useState<{
		columns: ColumnEntity<T>['field'][];
		index: TableNode<T>['index'];
	}>({
		columns: [],
		index: 0,
	});

	const loading = useMemo<boolean>(
		() => initialLoading || isLoading,
		[initialLoading, isLoading],
	);

	const error = initialError ?? fetchError;

	const columnsRaw = useMemo<ColumnEntity<T>[]>(() => {
		if (initialColumns?.length) {
			return initialColumns;
		}

		function calculateColumn(
			column: DataColumnProps<T>,
			level = 0,
			parentGroupKey?: string,
		): ColumnEntity<T> {
			const col: ColumnEntity<T> = {
				size: 1,
				level: level + 1,
				parentLevel: level,
				columns: [],

				isDraggable: !!column.draggable,
				isGroup: !!column.group,
				isGrouped: !!column.grouped,

				isSelecting: false,
				isActions: !!column.actions,
				isHoverSlot: false,
				isColumns: calculateIsColumns(column.children),
				isResizable: !!column.resizable,
				isHeader: !!column.header,
				isField: !!column.field && !column.actions,
				isEmpty: !column.field || !!column.actions,
				isSorted: false,
				isToggleable: false,
				colspan: calculateColspan(column.children) || column.size || 1,
				isFieldSplit: false,
				...column,
				children: undefined,
			};
			col.columnGroupKey = parentGroupKey;
			col.isSorted = resolveColumnFlag(column.sortable, col);
			col.isToggleable = resolveColumnFlag(column.toggleable, col);
			const childGroupKey =
				col.isColumns && col.isHeader ? getHeaderCellKey(col) : parentGroupKey;
			col.columns = Children.toArray(column.children).map((child: any) => {
				return calculateColumn(child.props, col.level, childGroupKey);
			});
			col.isFieldSplit = isFieldSplitColumn(col);
			if (col.isActions) {
				col.field = (col.field || '__actions__') as keyof T;
				col.isHeader = true;
				col.actionsAt = col.actionsAt ?? initialRowActionsAt;
				col.width = col.width ?? (col.actionsMenu ? 48 : 96);
				col.align = col.align ?? 'center';
			}
			return col;
		}

		const ret: ColumnEntity<T>[] = initialSelectable ? [selectColumn] : [];

		Children.forEach(children, (child: any) => {
			child?.props && ret.push(calculateColumn(child.props));
		});

		return ret;
	}, [initialColumns, children, initialSelectable, initialRowActionsAt]);

	const hasActionsColumn = useMemo(
		() => columnsRaw.some((column) => column.isActions),
		[columnsRaw],
	);

	const rowActionsOnHover = useMemo(
		() =>
			initialRowActionsOnHover ??
			(!!initialRowActions?.length && !hasActionsColumn),
		[initialRowActionsOnHover, initialRowActions, hasActionsColumn],
	);

	const columnFields = useMemo(() => getColumnFields(columnsRaw), [columnsRaw]);

	const groupKeys = useMemo<(keyof T)[]>(() => {
		if (initialGroupKeys?.length) {
			return initialGroupKeys;
		}
		return columnsRaw
			.filter((column) => column.isGrouped && column.field)
			.map((column) => column.field as keyof T);
	}, [initialGroupKeys, columnsRaw]);

	const resolvedMultiSort = initialMultiSort ?? groupKeys.length > 1;
	const resolvedMultiGroup = initialMultiGroup ?? groupKeys.length > 1;

	const { sort, changeSort } = useColumnSort(
		columnsRaw,
		storage,
		sortKey,
		sortDesc,
		resolvedMultiSort,
		initialSortRules,
	);
	const { columnOrder, segmentOrders, setColumnOrder, sortColumn, sortColumnSegment } = useColumnOrder(
		columnsRaw,
		storage,
		initialColumnOrder,
		onInitialColumnOrder,
	);
	const columnOrderIndex = useMemo(
		() => (columnOrder.length ? buildColumnOrderIndex(columnOrder) : null),
		[columnOrder],
	);
	const { hiddenColumns, toggleColumn } = useColumnHidden(
		columnsRaw,
		storage,
		initialHiddenColumns,
		onInitialHiddenColumns,
	);



	const [internalWidths, setInternalWidths] = useState<Partial<Record<keyof T, number>>>(
		() => {
			if (initialColumnWidth) {
				return initialColumnWidth;
			}
			const widths: Partial<Record<keyof T, number>> = {};
			columnsRaw.forEach((column: ColumnEntity<T>) => {
				if (!column?.field) {
					return;
				}
				widths[column.field as keyof T] = (storage?.getItem(
					`columns.${String(column.field)}.width`,
				) || column.width) as number;
			});
			return widths;
		},
	);

	const columnWidths = initialColumnWidth ?? internalWidths;
	const setColumnWidths = initialColumnWidth ? () => {} : setInternalWidths;
	const resizeColumn = useCallback(
		(column: ColumnEntity<T>, width: number, nextWidth: number) => {
			if (!column?.field) {
				return;
			}
			setColumnWidths((prev) => {
				const next: Record<keyof T, number> = {
					...prev,
					[column.field as keyof T]: width,
				};
				if (nextWidth !== undefined && column.field) {
					const idx = columnOrderIndex?.get(column.field as keyof T);
					const nextField = idx !== undefined ? columnOrder[idx + 1] : undefined;
					if (nextField) {
						next[nextField] = nextWidth;
					}
				}
				if (storage && !initialColumnWidth) {
					storage.setItem(`columns.${String(column.field)}.width`, width);
					if (nextWidth !== undefined) {
						const idx = columnOrderIndex?.get(column.field as keyof T);
						const nextField = idx !== undefined ? columnOrder[idx + 1] : undefined;
						if (nextField) {
							storage.setItem(`columns.${String(nextField)}.width`, nextWidth);
						}
					}
				}
				return next;
			});
			onInitialColumnResize?.(column, width, nextWidth);
		},
		[columnOrderIndex, storage, initialColumnWidth, onInitialColumnResize],
	);
	const getColumnWidth = useCallback(
		(column: ColumnEntity<T>) => {
			if (column.isGroup && !column.isGrouped) {
				return columnWidths[column.field as keyof T] ?? column.width;
			}
			if (column.isSelecting) {
				return columnWidths[column.field as keyof T] ?? column.width ?? 44;
			}
			if (column.isHoverSlot) {
				return 0;
			}
			return columnWidths[column.field as keyof T] || undefined;
		},
		[columnWidths],
	);

	const toggleExpand = useCallback(
		(
			expandKey: string | string[],
			kind: ExpandKind,
			options?: ToggleExpandOptions,
		) => {
			setExpands((prev) => {
				const updateKind = (current: string[]) => {
					if (Array.isArray(expandKey)) {
						if (options?.remove) {
							return current.filter((key) => !expandKey.includes(key));
						}
						if (options?.merge) {
							return [...new Set([...current, ...expandKey])];
						}
						return expandKey;
					}

					const allowMultiple = initialMultiple || resolvedMultiGroup;

					if (allowMultiple) {
						return current.includes(expandKey)
							? current.filter((key) => key !== expandKey)
							: [...current, expandKey];
					}
					return current.includes(expandKey) ? [] : [expandKey];
				};

				return {
					...prev,
					[kind]: updateKind(prev[kind]),
				};
			});
		},
		[initialMultiple, resolvedMultiGroup],
	);

	const expandedSets = useMemo(
		() => ({
			group: new Set(expands.group),
			grouped: new Set(expands.grouped),
		}),
		[expands],
	);

	const isExpanded = useCallback(
		(expandKey: string, kind: ExpandKind) => expandedSets[kind].has(expandKey),
		[expandedSets],
	);

	const render = useCallback<
		(
			nodes: TableNode<T>[],
			columns: ColumnEntity<T>[],
			visibleColumns: ColumnEntity<T>[],
		) => React.ReactNode
	>(
		(
			nodes: TableNode<T>[],
			columns: ColumnEntity<T>[],
			visibleColumns: ColumnEntity<T>[],
		) => {
			if (breakpoint && Layout) {
				return <Layout nodes={nodes} columns={visibleColumns} />;
			}
			return (
				<Table<T>
					withHeader={withHeader}
					nodes={nodes}
					columns={columns}
					visibleColumns={visibleColumns}
					level={level}
					{...props}
				/>
			);
		},
		[Layout, withHeader, breakpoint, props, level],
	);

	const columnFieldsKey = columnFields.join('|');
	const prevColumnFieldsKeyRef = useRef(columnFieldsKey);
	useEffect(() => {
		if (prevColumnFieldsKeyRef.current === columnFieldsKey) {
			return;
		}
		const prevFields = prevColumnFieldsKeyRef.current.split('|').filter(Boolean) as (keyof T)[];
		const removedFields = prevFields.filter((field) => !columnFields.includes(field));
		if (storage && removedFields.length && !initialColumnWidth) {
			purgeRemovedColumnStorage(storage, removedFields);
			setInternalWidths((prev) => {
				const next = { ...prev };
				for (const field of removedFields) {
					delete next[field];
				}
				return next;
			});
		}
		prevColumnFieldsKeyRef.current = columnFieldsKey;
	}, [columnFieldsKey, columnFields, storage, initialColumnWidth]);

	const orderedColumnsRaw = useMemo(
		() => orderColumnsTree(columnsRaw, columnOrderIndex, segmentOrders),
		[columnsRaw, columnOrderIndex, segmentOrders],
	);

	const columns = useMemo(() => {
		const { dataColumns: orderedData, normalColumns } = buildDataColumns(
			orderedColumnsRaw,
			groupAt,
			groupKeys,
		);
		const normal = [...normalColumns];
		const groupPart = orderedData.filter((c) => c.isGroup || c.isGrouped);
		const dataColumns = isGroupAtStart(groupAt)
			? [
					...groupPart.filter((c) => c.isGroup),
					...groupPart.filter((c) => c.isGrouped && !c.isGroup),
					...normal,
				]
			: [
					...normal,
					...groupPart.filter((c) => c.isGrouped && !c.isGroup),
					...groupPart.filter((c) => c.isGroup),
				];

		const selected = columnsRaw.filter((c) => c.isSelecting);
		const actionsStart = columnsRaw.filter(
			(c) => c.isActions && (c.actionsAt ?? initialRowActionsAt) === 'start',
		);
		const actionsEnd = columnsRaw.filter(
			(c) => c.isActions && (c.actionsAt ?? initialRowActionsAt) === 'end',
		);
		const hoverSlotStart =
			rowActionsOnHover && !hasActionsColumn && initialRowActionsAt === 'start'
				? [createHoverSlotColumn<T>('start')]
				: [];
		const hoverSlotEnd =
			rowActionsOnHover && !hasActionsColumn && initialRowActionsAt === 'end'
				? [createHoverSlotColumn<T>('end')]
				: [];

		const result: ColumnEntity<T>[] = [];
		if (initialSelectable === 'start') {
			result.push(...selected);
		}
		result.push(...actionsStart, ...hoverSlotStart, ...dataColumns, ...hoverSlotEnd, ...actionsEnd);
		if (initialSelectable === 'end') {
			result.push(...selected);
		}
		return result;
	}, [orderedColumnsRaw, groupAt, groupKeys, initialSelectable, initialRowActionsAt, rowActionsOnHover, hasActionsColumn, selectColumn]);

	const groupColumnField = useMemo(() => {
		const groupOnly = findGroupOnlyColumn(columns);
		if (groupOnly?.field) {
			return groupOnly.field as keyof T;
		}
		const unified = findColumnDeep(
			columns,
			(col) => col.isGroup && col.isGrouped && !col.isColumns,
		);
		return unified?.field as keyof T | undefined;
	}, [columns]);

	const isGroupStart = isGroupAtStart(groupAt);

	const visibleColumns = useMemo(() => {
		if (!hiddenColumns.length) {
			return columns;
		}
		return columns.filter((col) => !hiddenColumns.includes(col.field as keyof T));
	}, [columns, hiddenColumns]);

	const rowspan = useMemo(() => {
		let max = 0;
		(function recursive(columns: ColumnEntity<T>[]) {
			for (const column of columns) {
				max = max > column.level ? max : column.level;
				if (column.isColumns) {
					recursive(column.columns);
				}
			}
		})(columns);
		return max;
	}, [columns]);
	const colspan = useMemo(() => calculateTableColspan(columns), [columns]);

	const groupColumnEntity = useMemo(() => findGroupColumn(columns), [columns]);

	const groupLayout = useMemo(
		() => initialGroupLayout ?? resolveGroupLayout(groupColumnEntity),
		[initialGroupLayout, groupColumnEntity],
	);

	const handleModeChange = useCallback(
		(node: TableNode<T>, column: ColumnEntity<T>) => {
			if (!editMode) {
				return;
			}
			if (isGroupContainerRow(node, groupColumnEntity)) {
				return;
			}
			if (!column.editor) {
				return;
			}
			if (editMode === 'row') {
				setEditableMeta({
					index: node.index,
					columns: columns.filter((v) => v.isField).map((v) => v.field),
				});
			} else if (editMode === 'cell') {
				setEditableMeta({
					index: node.index,
					columns: [column.field],
				});
			}
		},
		[editMode, columns, groupColumnEntity],
	);
	const clearModeChange = useCallback(() => {
		setEditableMeta({
			index: 0,
			columns: [],
		});
	}, []);

	const updateNode = useCallback(
		(index: TableNode<T>['index'], field: keyof T, value: T[keyof T]) => {
			setData((prevData) => {
				const idx = prevData.findIndex((_, i) => i.toString() === index.toString());
				if (idx === -1) {
					return prevData;
				}
				const newData = [...prevData];
				const item = newData[idx];
				if (!item) {
					return prevData;
				}
				newData[idx] = { ...item, [field]: value };
				return newData;
			});
		},
		[],
	);

	const commitEdit = useCallback(
		(index: TableNode<T>['index']) => {
			let editedItem: T | undefined;
			setData((prevData) => {
				editedItem = prevData.find((_, i) => i.toString() === index.toString());
				return prevData;
			});
			if (editedItem !== undefined) {
				onRowEditComplete?.(editedItem, index);
			}
			clearModeChange();
		},
		[clearModeChange, onRowEditComplete],
	);

	const fetch = useCallback(
		(page: string | number = '', saveHistory = true) => {
			if (!mounted || typeof initialData !== 'function') {
				return;
			}
			setLoading(true);
			initialData({ limit, page })
				.then(({ data, next, total, pages }) => {
					setData(data);
					setNext(next);
					setFetchError(undefined);
					if (total) {
						setTotal(total);
					}
					if (pages) {
						setTotalPage(pages);
					}
					setLoading(false);
					saveHistory && setHistory((v) => [...v, page]);
				})
				.catch((error: IError) => {
					setFetchError(
						(error.response?.data as { detail?: string } | undefined)?.detail ||
							error?.message ||
							'Ошибка загрузки данных!',
					);
					setLoading(false);
				});
		},
		[initialData, limit, mounted],
	);

	const nodesRef = useRef<TableNode<T>[]>([]);

	const nodes: TableNode<T>[] = useMemo<TableNode<T>[]>(() => {
		let nextNodes: TableNode<T>[] = convertNodes(data, nodesRef.current);
		if (appliesTopLevelGrouping(groupLayout, groupKeys.length)) {
			nextNodes = groupByFirstKey<T>(nextNodes, groupKeys, initialGroupLevel);
		}

		if (!fetcher && limit > 0) {
			nextNodes = limitBy(nextNodes, limit, page as number);
		}
		if (sort.rules.length) {
			nextNodes = sortByRules(nextNodes, sort.rules);
		}
		nodesRef.current = nextNodes;
		return nextNodes;
	}, [data, sort.rules, groupKeys, groupLayout, initialGroupLevel, limit, page, fetcher]);

	useEffect(() => {
		if (initialTotal !== undefined) {
			setTotal(initialTotal);
			return;
		}
		setTotal(data.length);
	}, [initialTotal, data.length]);

	const expandables = useMemo<TableExpandablesState>(() => {
		const group =
			groupColumnEntity
				? nodes
						.filter((node) => hasGroupNestedData(node, groupColumnEntity))
						.map((node) => getNodeExpandKey(node))
				: [];

		const groupedByLevel: Partial<Record<number, string[]>> = {};
		for (let level = 0; level < groupKeys.length; level++) {
			const keys: string[] = [];
			const collect = (list: TableNode<T>[]) => {
				for (const node of list) {
					if (
						(node.groupLevel ?? 0) === level &&
						canExpandGroupedNode(node, groupKeys)
					) {
						keys.push(getNodeExpandKey(node));
					}
					if (node.nodes?.length) {
						collect(node.nodes);
					}
				}
			};
			collect(nodes);
			if (keys.length) {
				groupedByLevel[level] = keys;
			}
		}

		return { group, groupedByLevel };
	}, [nodes, groupColumnEntity, groupKeys]);

	const handlerNext = useCallback(() => {
		if (fetcher) {
			fetch(next, true);
		}
	}, [fetcher, fetch, next]);

	const handlerChangeLimit = useCallback(
		(val: number) => {
			setPage(initialPage);
			setLimit(val);
		},
		[initialPage],
	);
	const handlerPprevious = useCallback(
		function () {
			setHistory((prev) => {
				const newHistory = [...prev];
				newHistory.pop(); // удаляем текущую страницу
				const prevPage = newHistory[newHistory.length - 1];
				if (fetcher && prevPage !== undefined) {
					fetch(prevPage, false);
				}
				return newHistory;
			});
		},
		[fetcher, fetch],
	);

	useEffect(() => {
		if (!fetcher) {
			return;
		}
		setHistory([]);
		fetch(page);
	}, [fetch, page, fetcher]);

	useEffect(() => {
		setLimit(initialLimit);
		setPage(initialPage);
	}, [initialPage, initialLimit]);

	useEffect(() => {
		setData(Array.isArray(initialData) ? initialData : []);
	}, [initialData]);

	useEffect(() => {
		setTotalPage(Math.ceil(total / limit));
	}, [total, limit]);

	const { selectedRows, toggleRow, selectAll, isRowSelected, someSelected, allSelected } =
		useNodeSelect(nodes, storage, initialSelectedRows, onInitialSelectedRowsChange);

	const selectionContextValue = useMemo(
		() => ({
			selectedRows,
			toggleRow,
			selectAll,
			isRowSelected,
			someSelected,
			allSelected,
			selectable: initialSelectable,
		}),
		[
			selectedRows,
			toggleRow,
			selectAll,
			isRowSelected,
			someSelected,
			allSelected,
			initialSelectable,
		],
	);

	const expandContextValue = useMemo(
		() => ({
			expands,
			expandedSets,
			isExpanded,
			toggleExpand,
			expandables,
		}),
		[expands, expandedSets, isExpanded, toggleExpand, expandables],
	);

	const groupingContextValue = useMemo(
		() => ({
			groupAt,
			groupKeys,
			groupLayout,
			groupLevel: level,
			isGroupStart,
			groupColumnField,
			groupColumn: groupColumnEntity,
			multiGroup: resolvedMultiGroup,
			groupedHighlightLastRow,
		}),
		[
			groupAt,
			groupKeys,
			groupLayout,
			level,
			isGroupStart,
			groupColumnField,
			groupColumnEntity,
			resolvedMultiGroup,
			groupedHighlightLastRow,
		],
	);

	const columnSizingContextValue = useMemo(
		() => ({
			columnWidths,
			resizeColumn,
			getColumnWidth,
		}),
		[columnWidths, resizeColumn, getColumnWidth],
	);

	const editContextValue = useMemo(
		() => ({
			editMode,
			editableIndex: editableMeta.index,
			editableColumns: editableMeta.columns,
			handleModeChange,
			clearModeChange,
			commitEdit,
			updateNode,
		}),
		[
			editMode,
			editableMeta.index,
			editableMeta.columns,
			handleModeChange,
			clearModeChange,
			commitEdit,
			updateNode,
		],
	);

	const sortContextValue = useMemo(
		() => ({
			sort,
			changeSort,
			multiSort: resolvedMultiSort,
		}),
		[sort, changeSort, resolvedMultiSort],
	);

	const columnMetaContextValue = useMemo(
		() => ({
			columnOrder,
			onColumnOrder: setColumnOrder,
			sortColumn,
			sortColumnSegment,
			hiddenColumns,
			toggleColumn,
		}),
		[
			columnOrder,
			setColumnOrder,
			sortColumn,
			sortColumnSegment,
			hiddenColumns,
			toggleColumn,
		],
	);

	const rowActionsContextValue = useMemo(
		() => ({
			rowActions: initialRowActions,
			rowActionsPanel: initialRowActionsPanel,
			rowActionsOnHover,
			rowActionsAt: initialRowActionsAt,
			hasActionsColumn,
			bulkActions: initialBulkActions,
			bulkActionsPanel: initialBulkActionsPanel,
		}),
		[
			initialRowActions,
			initialRowActionsPanel,
			rowActionsOnHover,
			initialRowActionsAt,
			hasActionsColumn,
			initialBulkActions,
			initialBulkActionsPanel,
		],
	);

	const tableContextValue = useMemo(
		() => ({
			selectable: initialSelectable,
			nodes,
			props,
			colspan,
			rowspan,
			storage,
			breakpoint,
		}),
		[initialSelectable, nodes, props, colspan, rowspan, storage, breakpoint],
	);

	return (
		<TableSelectionProvider value={selectionContextValue}>
			<TableExpandProvider value={expandContextValue}>
				<TableGroupingProvider value={groupingContextValue}>
					<TableColumnSizingProvider value={columnSizingContextValue}>
						<TableSortProvider value={sortContextValue}>
							<TableColumnMetaProvider value={columnMetaContextValue}>
								<TableEditProvider value={editContextValue}>
									<TableRowActionsProvider value={rowActionsContextValue}>
										<TableDataProvider value={tableContextValue}>
											<Stack mih={minHeight} gap="md">
												<Loading active={loading} keepMounted mih={minHeight}>
													{error && <TableError>{error}</TableError>}
													{!error &&
														(nodes.length
															? render(nodes, columns, visibleColumns)
															: <TableEmpty text={noDataText} />)}
												</Loading>
												{withPagination && (
													<Pagination
														loading={loading}
														onNext={fetcher ? handlerNext : undefined}
														onPprevious={fetcher ? handlerPprevious : undefined}
														activePprevious={history?.length > 1}
														activeNext={!!next}
														page={page as number}
														total={totalPage}
														limit={limit}
														limits={initialLimits}
														onChangePage={setPage}
														onChangeLimit={handlerChangeLimit}
													/>
												)}
											</Stack>
										</TableDataProvider>
									</TableRowActionsProvider>
								</TableEditProvider>
							</TableColumnMetaProvider>
						</TableSortProvider>
					</TableColumnSizingProvider>
				</TableGroupingProvider>
			</TableExpandProvider>
		</TableSelectionProvider>
	);
};

