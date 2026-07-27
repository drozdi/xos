import type { ColumnEntity, TableGroupLayout, TableNode } from '../type';
import { findColumnDeep, findGroupOnlyColumn } from './column-fields';

export function buildExpandKey(
	parentKey: string | undefined,
	groupLevel: number,
	groupValue: unknown,
): string {
	const segment = `${groupLevel}:${String(groupValue)}`;
	return parentKey ? `${parentKey}/${segment}` : segment;
}

export function getNodeExpandKey(node: Pick<TableNode, 'expandKey' | 'index'>): string {
	return node.expandKey ?? String(node.index);
}

export function groupBy<T = object>(
	nodes: TableNode<T>[],
	key: keyof T | undefined,
	groupLevel?: number,
	parentExpandKey?: string,
): TableNode<T>[] {
	if (!key) {
		return nodes;
	}
	const groups = new Map<T[keyof T], TableNode<T>[]>();
	for (const node of nodes) {
		const groupValue = node.data[key];
		if (!groups.has(groupValue)) {
			groups.set(groupValue, []);
		}
		groups.get(groupValue)!.push(node);
	}
	const result: TableNode<T>[] = [];
	for (const group of groups.values()) {
		if (group?.length === 0) {
			continue;
		}
		const [first, ...rest] = group;
		const parent = first as TableNode<T>;
		const groupValue = parent.data[key];
		parent.nodes = rest.map((child) => {
			child.isChildren = true;
			return child;
		});
		parent.isChildren = false;
		parent.isParent = rest.length > 0;
		if (groupLevel !== undefined) {
			parent.groupLevel = groupLevel;
			parent.expandKey = buildExpandKey(parentExpandKey, groupLevel, groupValue);
		}
		for (const child of rest) {
			child.isParent = false;
			if (groupLevel !== undefined) {
				child.groupLevel = groupLevel;
			}
		}
		result.push(parent);
	}

	return result;
}

/** Группировка по ключу на уровне `startLevel` (0 — первый ключ в groupKeys). */
export function groupByFirstKey<T = object>(
	nodes: TableNode<T>[],
	keys: (keyof T)[],
	startLevel = 0,
): TableNode<T>[] {
	if (!keys.length || startLevel >= keys.length) {
		return nodes;
	}
	return groupBy(nodes, keys[startLevel], startLevel);
}

/**
 * При раскрытии родителя на уровне `parentGroupLevel` группирует детей
 * по следующему ключу или возвращает листья без группировки.
 */
export function groupChildrenForExpand<T = object>(
	children: TableNode<T>[],
	groupKeys: (keyof T)[],
	parentGroupLevel: number,
	parentExpandKey?: string,
): TableNode<T>[] {
	const nextKeyIndex = parentGroupLevel + 1;
	const nextKey = groupKeys[nextKeyIndex];
	if (!nextKey || !children.length) {
		return children;
	}
	return groupBy(children, nextKey, nextKeyIndex, parentExpandKey);
}

export function canExpandGroupedNode<T = object>(
	node: TableNode<T>,
	groupKeys: (keyof T)[],
): boolean {
	return !!node.isParent && (node.nodes?.length ?? 0) > 0 && groupKeys.length > 0;
}

/** Ячейка с кнопкой раскрытия grouped — не смещается. */
export function isGroupedExpanderCell<T = object>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
): boolean {
	if (!column.isGrouped || !canExpandGroupedNode(node, groupKeys)) {
		return false;
	}
	const level = node.groupLevel ?? 0;
	const activeKey = groupKeys[level];
	if (groupKeys.length > 1 && activeKey && column.field !== activeKey) {
		return false;
	}
	return true;
}

/** Ячейка с expander (grouped или unified group+grouped). */
export function hasGroupedCellExpander<T = object>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
): boolean {
	if (isUnifiedGroupColumn(column)) {
		return canExpandGroupedNode(node, groupKeys);
	}
	return isGroupedExpanderCell(node, column, groupKeys);
}

function countGroupedDataColumns<T>(columns: ColumnEntity<T>[]): number {
	return columns.filter((column) => column.isGrouped && !column.isGroup && column.field).length;
}

/** Уровни grouped: grouped-only колонки или groupKeys (режим unified-only). */
function resolveGroupedColumnsCount<T>(
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
): number {
	const dataColumns = countGroupedDataColumns(columns);
	return dataColumns > 0 ? dataColumns : groupKeys.length;
}

export function isGroupedTableRow<T>(
	node: Pick<TableNode, 'groupLevel' | 'isChildren' | 'expandKey'>,
	tableNestLevel: number,
): boolean {
	return node.groupLevel !== undefined || node.isChildren || !!node.expandKey || tableNestLevel > 0;
}

export function getGroupedColumnLevel<T>(
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
): number {
	if (!column.isGrouped || !column.field) {
		return -1;
	}
	return groupKeys.indexOf(column.field as keyof T);
}

/** Отступ: base + step × steps (1 — одинарный, 2 — двойной, …). */
export function getGroupedPaddingBySteps(steps: number): string | undefined {
	if (steps <= 0) {
		return undefined;
	}
	const base = 'var(--table-horizontal-spacing, 0.5rem)';
	const step = 'var(--mantine-spacing-md)';
	return `calc(${step} * ${steps} + ${base})`;
}

/** Отступ grouped-ячейки — paddingLeft (диагональ). */
export function toGroupedPaddingStyle(
	padding: string | undefined,
): { paddingLeft?: string } {
	if (!padding) {
		return {};
	}
	return { paddingLeft: padding };
}

/**
 * Глубина вложенности строки (1-based): groupLevel + 1 или max для листьев.
 * steps = nestingDepth − groupedLevel.
 */
export function resolveNestingDepth<T>(
	node: Pick<TableNode, 'groupLevel'>,
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[] = [],
): number {
	const groupedCount = resolveGroupedColumnsCount(columns, groupKeys);
	if (groupedCount === 0) {
		return 0;
	}
	if (node.groupLevel !== undefined) {
		return node.groupLevel + 1;
	}
	return groupedCount;
}

export function resolveGroupedPaddingSteps(nestingDepth: number, groupedLevel: number): number {
	return nestingDepth - groupedLevel;
}

/**
 * Шаги отступа grouped-ячейки.
 * end: expander — L; вложенные — rowGroupLevel+1.
 * start: expander — 0; вложенные — rowGroupLevel+1.
 */
export function resolveGroupedCellPaddingSteps(
	groupedLevel: number,
	isExpanderCell: boolean,
	rowGroupLevel: number,
	groupAt?: 'start' | 'end',
): number {
	if (isExpanderCell) {
		return isGroupAtStart(groupAt) ? 0 : groupedLevel;
	}
	return rowGroupLevel + 1;
}

/** Порядок grouped-колонок: start — по groupKeys; end — с конца (reverse). */
export function orderGroupedColumns<T>(
	groupedColumns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	groupAt?: 'start' | 'end',
): ColumnEntity<T>[] {
	if (groupedColumns.length <= 1) {
		return groupedColumns;
	}
	const sorted = [...groupedColumns].sort((a, b) => {
		const indexA = groupKeys.indexOf(a.field as keyof T);
		const indexB = groupKeys.indexOf(b.field as keyof T);
		if (indexA < 0 && indexB < 0) {
			return 0;
		}
		if (indexA < 0) {
			return 1;
		}
		if (indexB < 0) {
			return -1;
		}
		return indexA - indexB;
	});
	return isGroupAtStart(groupAt) ? sorted : [...sorted].reverse();
}

/** Отступ grouped-колонки в заголовке (max nesting). */
export function getGroupedHeaderPadding<T>(
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
	columns?: ColumnEntity<T>[],
): string | undefined {
	if (!canGroupedColumnHavePadding(column, groupKeys, columns)) {
		return undefined;
	}
	const groupedLevel = columns
		? resolveGroupedColumnLevel(column, columns, groupKeys)
		: getGroupedColumnLevel(column, groupKeys);
	if (groupedLevel < 0) {
		return undefined;
	}
	const groupedCount = columns ? countGroupedDataColumns(columns) : groupKeys.length;
	return getGroupedPaddingBySteps(resolveGroupedPaddingSteps(groupedCount, groupedLevel));
}

/** @deprecated используйте getGroupedPaddingBySteps */
export function getGroupedRowPadding(): string {
	return getGroupedPaddingBySteps(1)!;
}

/** Отступ grouped-колонки (fallback без контекста строки). */
export function getGroupedColumnPadding<T = object>(
	column: ColumnEntity<T>,
	columnLevel: number,
): string | undefined {
	if (columnLevel < 0 || !column.isGrouped) {
		return undefined;
	}
	return getGroupedPaddingBySteps(1);
}

export function resolveRowGroupLevel<T>(
	node: Pick<TableNode, 'groupLevel' | 'isChildren' | 'expandKey' | 'isParent'>,
	groupKeys: (keyof T)[],
	columns: ColumnEntity<T>[],
	tableNestLevel = 0,
): number {
	const groupedCount = resolveGroupedColumnsCount(columns, groupKeys);
	if (groupedCount === 0 || !isGroupedTableRow(node, tableNestLevel)) {
		return -1;
	}
	if (node.groupLevel !== undefined) {
		return node.groupLevel;
	}
	return groupedCount - 1;
}

function getGroupedColumnOrdinalLevel<T>(
	column: ColumnEntity<T>,
	columns: ColumnEntity<T>[],
): number {
	if (!column.isGrouped || column.isGroup || !column.field) {
		return -1;
	}
	const groupedColumns = columns.filter(
		(entry) => entry.isGrouped && !entry.isGroup && entry.field,
	);
	return groupedColumns.findIndex((entry) => entry.field === column.field);
}

function resolveGroupedColumnLevel<T>(
	column: ColumnEntity<T>,
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
): number {
	if (!column.isGrouped || column.isGroup || !column.field) {
		return -1;
	}
	const ordinal = getGroupedColumnOrdinalLevel(column, columns);
	if (ordinal >= 0) {
		return ordinal;
	}
	if (groupKeys.length > 0) {
		const level = getGroupedColumnLevel(column, groupKeys);
		if (level >= 0) {
			return level;
		}
	}
	return -1;
}

/** Последняя grouped-колонка не имеет вложенных grouped-строк — отступ не нужен. */
export function canGroupedColumnHavePadding<T>(
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
	columns?: ColumnEntity<T>[],
): boolean {
	const groupedLevel = columns
		? resolveGroupedColumnLevel(column, columns, groupKeys)
		: getGroupedColumnLevel(column, groupKeys);
	if (groupedLevel < 0) {
		return false;
	}
	const groupedColumnsCount = columns ? countGroupedDataColumns(columns) : groupKeys.length;
	return groupedColumnsCount <= 1 || groupedLevel < groupedColumnsCount - 1;
}

/** Индекс grouped-колонки текущего уровня строки в списке колонок. */
export function getGroupedShiftTargetIndex<T>(
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	rowGroupLevel: number,
): number {
	const targetKey = groupKeys[rowGroupLevel];
	if (targetKey !== undefined) {
		return columns.findIndex((column) => column.field === targetKey);
	}
	if (groupKeys.length === 0 && rowGroupLevel >= 0) {
		const groupedColumns = columns.filter(
			(column) => column.isGrouped && !column.isGroup && column.field,
		);
		const targetColumn = groupedColumns[rowGroupLevel] ?? groupedColumns[groupedColumns.length - 1];
		if (!targetColumn?.field) {
			return -1;
		}
		return columns.findIndex((column) => column.field === targetColumn.field);
	}
	return -1;
}

/**
 * Отступ ячейки строки в режиме grouped: один шаг на уровень вложенности (groupLevel).
 */
export function getGroupedCellPaddingForRow<T>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	_columnIndex: number,
	_columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	rowGroupLevel: number,
	_tableNestLevel = 0,
	groupAt?: 'start' | 'end',
): string | undefined {
	if (rowGroupLevel < 0) {
		return undefined;
	}
	if (column.isSelecting || column.isActions || column.isHoverSlot) {
		return undefined;
	}
	if (column.isGroup && !column.isGrouped) {
		return undefined;
	}
	if (isUnifiedGroupColumn(column)) {
		return undefined;
	}

	const steps = getGroupedNestedPaddingSteps(
		node,
		column,
		groupKeys,
		rowGroupLevel,
		groupAt,
	);
	return getGroupedPaddingBySteps(steps);
}

export function getGroupedColumnForLevel<T>(
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	level: number,
): ColumnEntity<T> | undefined {
	const key = groupKeys[level];
	if (!key) {
		return columns.find((column) => column.isGrouped);
	}
	return columns.find((column) => column.isGrouped && column.field === key);
}

/** Колонка одновременно group + grouped: список берётся из node.nodes, не из отдельного поля. */
export function isUnifiedGroupColumn<T>(
	column: Pick<ColumnEntity<T>, 'isGroup' | 'isGrouped'> | undefined,
): boolean {
	return !!column?.isGroup && !!column?.isGrouped;
}

export function resolveGroupLayout<T>(
	groupColumn: Pick<ColumnEntity<T>, 'isGroup' | 'isGrouped'> | undefined,
): TableGroupLayout {
	if (!groupColumn?.isGroup) {
		return 'default';
	}
	if (isUnifiedGroupColumn(groupColumn)) {
		return 'unified';
	}
	return 'group-first';
}

/** Grouped groupBy на текущем уровне (не внутри group-first вложенной таблицы). */
export function appliesTopLevelGrouping(
	groupLayout: TableGroupLayout,
	groupKeysLength: number,
): boolean {
	return groupKeysLength > 0 && groupLayout !== 'group-first';
}

/** Отступы grouped: один шаг для любой вложенной строки; на group-first верхнем уровне — нет. */
export function appliesGroupedCellPadding(
	groupLayout: TableGroupLayout,
	tableNestLevel: number,
): boolean {
	return groupLayout !== 'group-first' || tableNestLevel > 0;
}

/** Строка внутри раскрытой grouped-группы (не корневой родитель). */
export function isGroupedNestedRow<T>(
	node: Pick<TableNode<T>, 'groupLevel' | 'isChildren'>,
): boolean {
	return (node.groupLevel ?? 0) > 0 || node.isChildren;
}

/** Тип линии древовидной направляющей в grouped-колонке. */
export type GroupedTreeLineKind = 'none' | 'vertical' | 'branch' | 'branch-last';

/**
 * Линия вместо значения в grouped-колонке для вложенных строк.
 * vertical — сквозная │; branch — ├; branch-last — └.
 */
export function getGroupedTreeLineKind<T>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	isLastInSiblingGroup: boolean,
): GroupedTreeLineKind {
	if (isUnifiedGroupColumn(column) || !column.isGrouped || column.isGroup || !column.field) {
		return 'none';
	}
	if (!isGroupedNestedRow(node)) {
		return 'none';
	}

	const columnLevel = resolveGroupedColumnLevel(column, columns, groupKeys);
	if (columnLevel < 0) {
		return 'none';
	}

	const rowGroupLevel =
		node.groupLevel ??
		(groupKeys.length > 0 ? Math.min(groupKeys.length - 1, columnLevel) : columnLevel);

	if (columnLevel > rowGroupLevel) {
		return 'none';
	}

	if (columnLevel === rowGroupLevel) {
		return 'none';
	}

	if (columnLevel === rowGroupLevel - 1) {
		return isLastInSiblingGroup ? 'branch-last' : 'branch';
	}

	return 'vertical';
}

export function shouldHideGroupedColumnValue<T>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	columns: ColumnEntity<T>[],
	groupKeys: (keyof T)[],
	isLastInSiblingGroup: boolean,
): boolean {
	return getGroupedTreeLineKind(node, column, columns, groupKeys, isLastInSiblingGroup) !== 'none';
}

/**
 * Шаги отступа для grouped: корень — по уровню колонки (groupAt end);
 * вложенные строки — 0 (иерархия через линии дерева).
 */
export function getGroupedNestedPaddingSteps<T>(
	node: TableNode<T>,
	column: ColumnEntity<T>,
	groupKeys: (keyof T)[],
	rowGroupLevel: number,
	groupAt?: 'start' | 'end',
): number {
	const groupedLevel = getGroupedColumnLevel(column, groupKeys);
	if (groupedLevel < 0 || groupedLevel > rowGroupLevel) {
		return 0;
	}

	const isExpander = hasGroupedCellExpander(node, column, groupKeys);

	if (!isGroupedNestedRow(node)) {
		if (isExpander && !isGroupAtStart(groupAt)) {
			return groupedLevel;
		}
		return 0;
	}

	return 0;
}

/** Отступ для не-grouped колонок вложенной строки (0 — без сдвига). */
export function getNestedRowPaddingSteps<T>(
	_node: Pick<TableNode<T>, 'groupLevel' | 'isChildren'>,
): number {
	return 0;
}

/** groupAt по умолчанию — start. */
export function isGroupAtStart(groupAt?: 'start' | 'end'): boolean {
	return groupAt !== 'end';
}

const isSpecialColumn = <T>(column: ColumnEntity<T>) =>
	column.isSelecting || column.isActions || column.isHoverSlot;

/**
 * Порядок data-колонок: group → grouped → normal (start) или наоборот (end).
 * group-only всегда ближе к краю, чем grouped-only.
 */
export function buildDataColumns<T>(
	columnsRaw: ColumnEntity<T>[],
	groupAt?: 'start' | 'end',
	groupKeys?: (keyof T)[],
): {
	groupColumns: ColumnEntity<T>[];
	groupedColumns: ColumnEntity<T>[];
	normalColumns: ColumnEntity<T>[];
	dataColumns: ColumnEntity<T>[];
	groupColumnField?: keyof T;
} {
	const groupOnly = columnsRaw.filter(
		(column) => column.isGroup && !column.isGrouped && !isSpecialColumn(column),
	);
	const groupedOnly = columnsRaw.filter(
		(column) => column.isGrouped && !column.isGroup && !isSpecialColumn(column),
	);
	const unified = columnsRaw.filter(
		(column) => column.isGroup && column.isGrouped && !isSpecialColumn(column),
	);
	const groupColumns = [...groupOnly, ...unified];
	const normalColumns = columnsRaw.filter(
		(column) => !column.isGroup && !column.isGrouped && !isSpecialColumn(column),
	);

	const groupedKeys =
		groupKeys ?? groupedOnly.map((column) => column.field as keyof T);
	const orderedGrouped = orderGroupedColumns(groupedOnly, groupedKeys, groupAt);

	const dataColumns = isGroupAtStart(groupAt)
		? [...groupColumns, ...orderedGrouped, ...normalColumns]
		: [...normalColumns, ...orderedGrouped, ...groupColumns];

	const groupColumnField =
		(findGroupOnlyColumn(columnsRaw)?.field as keyof T | undefined) ??
		(findColumnDeep(
			columnsRaw,
			(column) => column.isGroup && column.isGrouped && !column.isColumns,
		)?.field as keyof T | undefined);

	return {
		groupColumns,
		groupedColumns: orderedGrouped,
		normalColumns,
		dataColumns,
		groupColumnField,
	};
}

export function getGroupItemsField<T>(
	column: Pick<ColumnEntity<T>, 'isGroup' | 'isGrouped' | 'field'>,
): keyof T | undefined {
	if (!column.isGroup || !column.field || column.isGrouped) {
		return undefined;
	}
	return column.field as keyof T;
}

export function getGroupNestedData<T>(node: TableNode<T>, column: ColumnEntity<T>): T[] {
	if (isUnifiedGroupColumn(column)) {
		return (node.nodes ?? []).map((child) => child.data);
	}
	const itemsField = getGroupItemsField(column);
	if (!itemsField) {
		return [];
	}
	const value = node.data[itemsField];
	return Array.isArray(value) ? (value as T[]) : [];
}

export function hasGroupNestedData<T>(node: TableNode<T>, column: ColumnEntity<T>): boolean {
	if (isUnifiedGroupColumn(column)) {
		return (node.nodes?.length ?? 0) > 0;
	}
	return getGroupNestedData(node, column).length > 0;
}

/** Строка-контейнер group/unified: вложенная таблица — другой набор элементов, родитель не редактируется. */
export function isGroupContainerRow<T>(
	node: TableNode<T>,
	groupColumn: ColumnEntity<T> | undefined,
): boolean {
	if (!groupColumn?.isGroup) {
		return false;
	}
	return hasGroupNestedData(node, groupColumn);
}

/**
 * Разметка строки вложенной group/unified-таблицы:
 * пустая ячейка на месте expander-колонки, остальные объединены под вложенную таблицу.
 */
export function getGroupOnlyNestedRowLayout<T>(
	columns: ColumnEntity<T>[],
	expandColumn: ColumnEntity<T>,
	groupAt: 'start' | 'end' = 'start',
): {
	beforeColumns: ColumnEntity<T>[];
	afterColumns: ColumnEntity<T>[];
	expandColumn: ColumnEntity<T>;
	nestedColumns: ColumnEntity<T>[];
	nestedBeforeExpander: boolean;
} {
	const expandIndex = columns.findIndex((column) => column.field === expandColumn.field);
	if (expandIndex < 0) {
		return {
			beforeColumns: [],
			afterColumns: columns,
			expandColumn,
			nestedColumns: columns,
			nestedBeforeExpander: true,
		};
	}

	const beforeColumns = columns.slice(0, expandIndex);
	const afterColumns = columns.slice(expandIndex + 1);

	if (isGroupAtStart(groupAt)) {
		if (afterColumns.length > 0) {
			return {
				beforeColumns,
				afterColumns,
				expandColumn,
				nestedColumns: afterColumns,
				nestedBeforeExpander: false,
			};
		}
		return {
			beforeColumns,
			afterColumns,
			expandColumn,
			nestedColumns: beforeColumns,
			nestedBeforeExpander: true,
		};
	}

	if (beforeColumns.length > 0) {
		return {
			beforeColumns,
			afterColumns,
			expandColumn,
			nestedColumns: beforeColumns,
			nestedBeforeExpander: true,
		};
	}
	return {
		beforeColumns,
		afterColumns,
		expandColumn,
		nestedColumns: afterColumns,
		nestedBeforeExpander: false,
	};
}

/** Колонки вложенной group-first таблицы: без group-only, grouped сохраняются. */
export function getGroupNestedColumns<T>(columns: ColumnEntity<T>[]): ColumnEntity<T>[] {
	return columns.filter((column) => {
		if (isSpecialColumn(column)) {
			return true;
		}
		if (column.isGroup && !column.isGrouped) {
			return false;
		}
		return true;
	});
}

/** Колонки вложенной таблицы group: без group/grouped-колонок и без повторной группировки. */
export function getNestedTableColumns<T>(columns: ColumnEntity<T>[]): ColumnEntity<T>[] {
	return columns
		.filter((column) => !column.isGroup && !column.isGrouped)
		.map((column) => ({
			...column,
			group: undefined,
			grouped: undefined,
			isGroup: false,
			isGrouped: false,
		}));
}

/** Колонки вложенной таблицы: первая — колонка с expander (выравнивание с padStart). */
export function alignNestedColumnsFromExpander<T>(
	columns: ColumnEntity<T>[],
	expandColumn: ColumnEntity<T> | undefined,
): ColumnEntity<T>[] {
	if (!expandColumn?.field) {
		return columns;
	}
	const start = columns.findIndex((column) => column.field === expandColumn.field);
	if (start <= 0) {
		return columns;
	}
	return columns.slice(start);
}

/**
 * Колонки вложенной grouped-таблицы (режим grouped-first):
 * без group-only колонки; grouped с level >= parentGroupLevel (текущий уровень включается).
 */
export function getGroupedNestedColumns<T>(
	columns: ColumnEntity<T>[],
	parentGroupLevel: number,
	groupKeys: (keyof T)[],
): ColumnEntity<T>[] {
	return columns.filter((column) => {
		if (column.isHoverSlot || column.isSelecting || column.isActions) {
			return true;
		}
		if (isUnifiedGroupColumn(column)) {
			return false;
		}
		if (column.isGroup && !column.isGrouped) {
			return false;
		}
		if (column.isGrouped && column.field) {
			const level = groupKeys.indexOf(column.field as keyof T);
			return level >= parentGroupLevel;
		}
		return true;
	});
}

/** Разметка строки вложенной таблицы (padding + colSpan). */
export function getNestedExpandLayout<T>(
	columns: ColumnEntity<T>[],
	expandColumn: ColumnEntity<T>,
	groupAt: 'start' | 'end' = 'start',
): { padStart: number; padEnd: number; nestedColspan: number } {
	const expandIndex = columns.findIndex((column) => column.field === expandColumn.field);
	if (expandIndex < 0) {
		return { padStart: 0, padEnd: 0, nestedColspan: columns.length };
	}

	// group / unified: вложенная таблица начинается после колонки с кнопкой
	// grouped-only: вложенная таблица начинается с колонки grouped (включая её)
	const padStart =
		groupAt === 'end'
			? 0
			: expandColumn.isGroup
				? expandIndex + 1
				: expandIndex;

	const padEnd =
		groupAt === 'end'
			? expandColumn.isGroup
				? columns.length - expandIndex - 1
				: columns.length - expandIndex
			: 0;

	return {
		padStart,
		padEnd,
		nestedColspan: columns.length - padStart - padEnd,
	};
}
