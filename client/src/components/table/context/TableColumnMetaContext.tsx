import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { ColumnEntity } from '../type';

export interface TableColumnMetaContext<T = object> {
	columnOrder: (keyof T)[];
	onColumnOrder: (columnOrder: (keyof T)[]) => void;
	sortColumn: (dragField: keyof T, dropField: keyof T) => void;
	sortColumnSegment: (dragKey: string, dropKey: string, parentKey: string) => void;
	hiddenColumns: (keyof T)[];
	toggleColumn: (column: ColumnEntity<T>, hidden?: boolean) => void;
}

const [Provider, useContext] = createSafeContext<TableColumnMetaContext<unknown>>(
	'TableColumnMetaContext was not found in the tree',
);

export function TableColumnMetaProvider<T = object>({
	children,
	value,
}: {
	value: TableColumnMetaContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableColumnMetaContext<unknown>}>{children}</Provider>;
}

export function useTableColumnMetaContext<T = object>(): TableColumnMetaContext<T> {
	return useContext() as TableColumnMetaContext<T>;
}
