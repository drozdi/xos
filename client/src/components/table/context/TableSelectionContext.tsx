import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { TableDataProps, TableNode } from '../type';

export interface TableSelectionContext<T = object> {
	selectedRows: TableNode<T>['index'][];
	toggleRow: (index: TableNode<T>['index']) => void;
	selectAll: (selected: boolean) => void;
	isRowSelected: (index: TableNode<T>['index']) => boolean;
	someSelected: boolean;
	allSelected: boolean;
	selectable?: TableDataProps<T>['selectable'];
}

const [Provider, useContext] = createSafeContext<TableSelectionContext<unknown>>(
	'TableSelectionContext was not found in the tree',
);

export function TableSelectionProvider<T = object>({
	children,
	value,
}: {
	value: TableSelectionContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableSelectionContext<unknown>}>{children}</Provider>;
}

export function useTableSelectionContext<T = object>(): TableSelectionContext<T> {
	return useContext() as TableSelectionContext<T>;
}
