import type { ColumnEntity } from '../type';
import { compareByColumnOrder } from './column-order-index';

export const ROOT_COLUMN_GROUP = '__root__';

/** Дочерний заголовок split-field (без field, только header). */
export function isFieldSplitHeaderChild<T>(column: ColumnEntity<T>): boolean {
	return (
		!column.field &&
		!!column.isHeader &&
		!column.isColumns &&
		!column.isGroup &&
		!column.isGrouped &&
		!column.isSelecting &&
		!column.isActions &&
		!column.isHoverSlot
	);
}

/**
 * DataColumn с field и header-only детьми: в tbody одна ячейка с colspan = числу подколонок.
 */
export function isFieldSplitColumn<T>(column: ColumnEntity<T>): boolean {
	if (!column.field || !column.isField || !column.isColumns || column.columns.length === 0) {
		return false;
	}
	return column.columns.every(isFieldSplitHeaderChild);
}

/** Группа колонок без field — tbody строится из дочерних колонок. */
export function isColumnGroupOnly<T>(column: ColumnEntity<T>): boolean {
	return column.isColumns && !!column.isHeader && !column.field;
}

/** Листовые колонки для tbody (раскрывает вложенные isColumns). */
export function flattenBodyColumns<T>(columns: ColumnEntity<T>[]): ColumnEntity<T>[] {
	const result: ColumnEntity<T>[] = [];
	for (const column of columns) {
		if (column.isFieldSplit || isFieldSplitColumn(column)) {
			result.push(column);
			continue;
		}
		if (column.isColumns && column.columns.length > 0) {
			result.push(...flattenBodyColumns(column.columns));
			continue;
		}
		result.push(column);
	}
	return result;
}

export function getHeaderCellKey<T>(column: ColumnEntity<T>): string {
	if (column.field) {
		return String(column.field);
	}
	if (column.isSelecting) {
		return '__select__';
	}
	if (column.isHoverSlot) {
		return '__hover_slot__';
	}
	if (column.isActions) {
		return '__actions__';
	}
	return `header-${column.level}-${String(column.header ?? column.colspan)}`;
}

export const TABLE_EXPANDER_COLUMN_WIDTH = 'var(--table-select-column-width, 2.75rem)';

export function isGroupOnlyExpanderColumn<T>(
	column: Pick<ColumnEntity<T>, 'isGroup' | 'isGrouped'>,
): boolean {
	return !!column.isGroup && !column.isGrouped;
}

/** Рекурсивный поиск колонки (в т.ч. внутри isColumns). */
export function findColumnDeep<T>(
	columns: ColumnEntity<T>[],
	predicate: (column: ColumnEntity<T>) => boolean,
): ColumnEntity<T> | undefined {
	for (const column of columns) {
		if (column.isColumns && column.columns.length > 0) {
			const nested = findColumnDeep(column.columns, predicate);
			if (nested) {
				return nested;
			}
		}
		if (predicate(column)) {
			return column;
		}
	}
	return undefined;
}

export function findGroupOnlyColumn<T>(columns: ColumnEntity<T>[]): ColumnEntity<T> | undefined {
	return findColumnDeep(
		columns,
		(column) => column.isGroup && !column.isGrouped && !column.isColumns,
	);
}

export function findGroupColumn<T>(columns: ColumnEntity<T>[]): ColumnEntity<T> | undefined {
	return (
		findGroupOnlyColumn(columns) ??
		findColumnDeep(
			columns,
			(column) => column.isGroup && column.isGrouped && !column.isColumns,
		)
	);
}

/** Физический colspan колонки в tbody (split-field → colspan, остальные → 1). */
export function getBodyColumnPhysicalSpan<T>(column: ColumnEntity<T>): number {
	if (column.isFieldSplit || isFieldSplitColumn(column)) {
		return column.colspan;
	}
	return 1;
}

export function sumBodyColumnPhysicalSpans<T>(columns: ColumnEntity<T>[]): number {
	return columns.reduce((sum, column) => sum + getBodyColumnPhysicalSpan(column), 0);
}

/** Число физических колонок tbody (включая group-only и split-field). */
export function calculateTableColspan<T>(columns: ColumnEntity<T>[]): number {
	return sumBodyColumnPhysicalSpans(flattenBodyColumns(columns)) || 1;
}

export function resolveColumnGroupKey<T>(column: ColumnEntity<T>): string {
	return column.columnGroupKey ?? ROOT_COLUMN_GROUP;
}

/** Колонка внутри группы (не корневой уровень). */
export function isNestedColumn<T>(column: ColumnEntity<T>): boolean {
	return column.columnGroupKey != null;
}

/** Заголовок группы колонок — перетаскивается при draggable на DataColumn-группе. */
export function isColumnGroupHeader<T>(column: ColumnEntity<T>): boolean {
	return column.isColumns && column.isHeader;
}

/** Сегмент порядка на уровне родителя: группа колонок или одиночное reorderable-поле. */
export function getColumnSegmentKey<T>(column: ColumnEntity<T>): string {
	if (isColumnGroupHeader(column)) {
		return getHeaderCellKey(column);
	}
	if (column.field) {
		return String(column.field);
	}
	return getHeaderCellKey(column);
}

export function isColumnSegmentAtLevel<T>(column: ColumnEntity<T>): boolean {
	if (isNestedColumn(column)) {
		return isColumnOrderReorderable(column);
	}
	return isColumnGroupHeader(column) || isColumnOrderReorderable(column);
}

export function collectLevelSegmentKeys<T>(columns: ColumnEntity<T>[]): string[] {
	return columns.filter(isColumnSegmentAtLevel).map(getColumnSegmentKey);
}

export function buildSegmentOrdersMap<T>(columns: ColumnEntity<T>[]): Record<string, string[]> {
	const map: Record<string, string[]> = {};

	function walk(cols: ColumnEntity<T>[], parentKey: string) {
		const keys = collectLevelSegmentKeys(cols);
		if (keys.length) {
			map[parentKey] = keys;
		}
		for (const column of cols) {
			if (column.isColumns && column.columns.length > 0) {
				const nextParent = column.isHeader ? getHeaderCellKey(column) : parentKey;
				walk(column.columns, nextParent);
			}
		}
	}

	walk(columns, ROOT_COLUMN_GROUP);
	return map;
}

export function mergeSegmentOrders(
	stored: Record<string, string[]>,
	current: Record<string, string[]>,
): Record<string, string[]> {
	const result: Record<string, string[]> = {};
	for (const [parentKey, keys] of Object.entries(current)) {
		const prev = stored[parentKey] ?? [];
		const merged = [
			...prev.filter((key) => keys.includes(key)),
			...keys.filter((key) => !prev.includes(key)),
		];
		result[parentKey] = merged;
	}
	return result;
}

function reorderSegmentsAtLevel<T>(
	columns: ColumnEntity<T>[],
	segmentOrder: string[] | null | undefined,
): ColumnEntity<T>[] {
	if (!segmentOrder?.length) {
		return columns;
	}

	const reorderableIndexes: number[] = [];
	for (let index = 0; index < columns.length; index++) {
		if (isColumnSegmentAtLevel(columns[index]!)) {
			reorderableIndexes.push(index);
		}
	}

	if (reorderableIndexes.length <= 1) {
		return columns;
	}

	const sorted = [...reorderableIndexes.map((index) => columns[index]!)].sort((a, b) => {
		const left = segmentOrder.indexOf(getColumnSegmentKey(a));
		const right = segmentOrder.indexOf(getColumnSegmentKey(b));
		return (left === -1 ? Number.MAX_SAFE_INTEGER : left) -
			(right === -1 ? Number.MAX_SAFE_INTEGER : right);
	});

	const result = [...columns];
	reorderableIndexes.forEach((index, position) => {
		result[index] = sorted[position]!;
	});
	return result;
}

/** Поле участвует в перестановке порядка колонок внутри своей группы. */
export function isColumnOrderReorderable<T>(column: ColumnEntity<T>): boolean {
	if (
		!column.field ||
		!column.isField ||
		column.isGroup ||
		column.isGrouped ||
		column.isSelecting ||
		column.isActions ||
		column.isHoverSlot
	) {
		return false;
	}
	if (column.isFieldSplit || isFieldSplitColumn(column)) {
		return true;
	}
	return !isColumnGroupHeader(column);
}

/** Поле для сортировки данных: own field или первый field в группе колонок. */
export function resolveColumnSortField<T>(
	column: ColumnEntity<T>,
): keyof T | undefined {
	if (column.field && column.isField) {
		return column.field as keyof T;
	}
	if (
		!isNestedColumn(column) &&
		(isColumnGroupOnly(column) || (column.isColumns && column.isHeader && !column.field))
	) {
		for (const child of flattenBodyColumns(column.columns)) {
			if (child.field && child.isField) {
				return child.field as keyof T;
			}
		}
	}
	return undefined;
}

/** Колонку можно перетаскивать: на корне — field или группа; вложенные — только field. */
export function isColumnReorderTarget<T>(column: ColumnEntity<T>): boolean {
	const isFieldColumn = isColumnOrderReorderable(column);
	if (isNestedColumn(column)) {
		return isFieldColumn;
	}
	return isFieldColumn || isColumnGroupHeader(column);
}

export function buildFieldGroupMap<T>(columns: ColumnEntity<T>[]): Map<keyof T, string> {
	const map = new Map<keyof T, string>();

	function walk(cols: ColumnEntity<T>[], groupKey: string) {
		for (const column of cols) {
			const nextGroupKey =
				column.isColumns && column.isHeader ? getHeaderCellKey(column) : groupKey;

			if (column.isFieldSplit || isFieldSplitColumn(column)) {
				if (column.field && column.isField) {
					map.set(column.field as keyof T, groupKey);
				}
				continue;
			}

			if (column.isColumns && column.columns.length > 0) {
				walk(column.columns, nextGroupKey);
				continue;
			}

			if (column.field && column.isField) {
				map.set(column.field as keyof T, groupKey);
			}
		}
	}

	walk(columns, ROOT_COLUMN_GROUP);
	return map;
}

/** Сортировка порядка колонок: сегменты (группы) и поля — только внутри одного родителя. */
export function orderColumnsTree<T>(
	columns: ColumnEntity<T>[],
	orderIndex: Map<keyof T, number> | null,
	segmentOrders?: Record<string, string[]> | null,
	parentKey: string = ROOT_COLUMN_GROUP,
): ColumnEntity<T>[] {
	const withNested = columns.map((column) => {
		if (column.isColumns && column.columns.length > 0) {
			const nextParent = column.isHeader ? getHeaderCellKey(column) : parentKey;
			return {
				...column,
				columns: orderColumnsTree(column.columns, orderIndex, segmentOrders, nextParent),
			};
		}
		return column;
	});

	let ordered = reorderSegmentsAtLevel(withNested, segmentOrders?.[parentKey]);

	if (!orderIndex) {
		return ordered;
	}

	const reorderableIndexes: number[] = [];
	for (let index = 0; index < ordered.length; index++) {
		if (isColumnOrderReorderable(ordered[index]!)) {
			reorderableIndexes.push(index);
		}
	}

	if (reorderableIndexes.length <= 1) {
		return ordered;
	}

	const reorderable = reorderableIndexes.map((index) => ordered[index]!);
	reorderable.sort((a, b) =>
		compareByColumnOrder(a.field as keyof T, b.field as keyof T, orderIndex),
	);

	const result = [...ordered];
	reorderableIndexes.forEach((index, position) => {
		result[index] = reorderable[position]!;
	});
	return result;
}

/** Поля колонок, участвующие в порядке / скрытии / ширине / сортировке. */
export function getColumnFields<T>(columns: ColumnEntity<T>[]): (keyof T)[] {
	const result: (keyof T)[] = [];
	for (const column of columns) {
		if (column.isFieldSplit || isFieldSplitColumn(column)) {
			if (column.field && column.isField) {
				result.push(column.field as keyof T);
			}
			continue;
		}
		if (column.isColumns && column.columns.length > 0) {
			result.push(...getColumnFields(column.columns));
			continue;
		}
		if (
			column.field &&
			column.isField &&
			!column.isSelecting &&
			!column.isActions &&
			!column.isHoverSlot
		) {
			result.push(column.field as keyof T);
		}
	}
	return result;
}

/** Оставляет только значения, присутствующие в актуальном наборе полей. */
export function intersectFields<T>(
	stored: (keyof T)[],
	fields: (keyof T)[],
): (keyof T)[] {
	if (!stored.length) {
		return [];
	}
	const fieldSet = new Set(fields);
	return stored.filter((field) => fieldSet.has(field));
}

/** Сохраняет порядок из storage и добавляет новые поля в конец. */
export function mergeColumnOrder<T>(
	stored: (keyof T)[],
	fields: (keyof T)[],
): (keyof T)[] {
	const ordered = intersectFields(stored, fields);
	for (const field of fields) {
		if (!ordered.includes(field)) {
			ordered.push(field);
		}
	}
	return ordered;
}

/** Удаляет из storage ширины и прочие per-field ключи для удалённых колонок. */
export function purgeRemovedColumnStorage(
	storage: { removeItem(key: string): void },
	removedFields: (string | number | symbol)[],
): void {
	for (const field of removedFields) {
		storage.removeItem(`columns.${String(field)}.width`);
	}
}
