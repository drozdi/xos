import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { TableSortState } from '../type';

export interface TableSortContext<T = object> {
	sort: TableSortState<T>;
	changeSort: (field: keyof T, options?: { multi?: boolean }) => void;
	multiSort: boolean;
}

const [Provider, useContext] = createSafeContext<TableSortContext<unknown>>(
	'TableSortContext was not found in the tree',
);

export function TableSortProvider<T = object>({
	children,
	value,
}: {
	value: TableSortContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableSortContext<unknown>}>{children}</Provider>;
}

export function useTableSortContext<T = object>(): TableSortContext<T> {
	return useContext() as TableSortContext<T>;
}
