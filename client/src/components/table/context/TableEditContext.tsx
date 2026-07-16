import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { ColumnEntity, TableDataProps, TableNode } from '../type';

export interface TableEditContext<T = object> {
	editMode: TableDataProps<T>['editMode'];
	editableIndex: TableNode<T>['index'];
	editableColumns: ColumnEntity<T>['field'][];
	handleModeChange: (item: TableNode<T>, column: ColumnEntity<T>) => void;
	clearModeChange: () => void;
	commitEdit: (index: TableNode<T>['index']) => void;
	updateNode: (index: TableNode<T>['index'], field: keyof T, value: T[keyof T]) => void;
}

const [Provider, useContext] = createSafeContext<TableEditContext<unknown>>(
	'TableEditContext was not found in the tree',
);

export function TableEditProvider<T = object>({
	children,
	value,
}: {
	value: TableEditContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableEditContext<unknown>}>{children}</Provider>;
}

export function useTableEditContext<T = object>(): TableEditContext<T> {
	return useContext() as TableEditContext<T>;
}
