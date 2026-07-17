import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type {
	TableBulkAction,
	TableBulkActionsPanelProps,
	TableDataProps,
	TableRowAction,
	TableRowActionsPanelProps,
} from '../type';

export interface TableRowActionsContext<T = object> {
	rowActions?: TableRowAction<T>[];
	rowActionsPanel: React.FC<TableRowActionsPanelProps<T>>;
	rowActionsOnHover: boolean;
	rowActionsAt: NonNullable<TableDataProps['rowActionsAt']>;
	hasActionsColumn: boolean;
	bulkActions?: TableBulkAction<T>[];
	bulkActionsPanel: React.FC<TableBulkActionsPanelProps<T>>;
}

const [Provider, useContext] = createSafeContext<TableRowActionsContext<unknown>>(
	'TableRowActionsContext was not found in the tree',
);

export function TableRowActionsProvider<T = object>({
	children,
	value,
}: {
	value: TableRowActionsContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableRowActionsContext<unknown>}>{children}</Provider>;
}

export function useTableRowActionsContext<T = object>(): TableRowActionsContext<T> {
	return useContext() as TableRowActionsContext<T>;
}
