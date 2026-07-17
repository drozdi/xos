import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { ColumnEntity } from '../type';

export interface TableColumnSizingContext<T = object> {
	columnWidths?: Partial<Record<keyof T, number>>;
	resizeColumn: (column: ColumnEntity<T>, width: number, nextWidth: number) => void;
	getColumnWidth: (column: ColumnEntity<T>) => number | undefined;
}

const [Provider, useContext] = createSafeContext<TableColumnSizingContext<unknown>>(
	'TableColumnSizingContext was not found in the tree',
);

export function TableColumnSizingProvider<T = object>({
	children,
	value,
}: {
	value: TableColumnSizingContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableColumnSizingContext<unknown>}>{children}</Provider>;
}

export function useTableColumnSizingContext<T = object>(): TableColumnSizingContext<T> {
	return useContext() as TableColumnSizingContext<T>;
}
