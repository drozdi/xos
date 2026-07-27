import { type TableProps } from '@mantine/core';
import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { TableDataProps, TableNode } from '../type';

export interface TableDataContext<T = object> {
	breakpoint: boolean;
	props: TableProps;
	colspan: number;
	rowspan: number;
	selectable?: TableDataProps<T>['selectable'];
	nodes: TableNode<T>[];
	storage?: import('../type').TableStorage;
}

const [Provider, useContext] = createSafeContext<TableDataContext<unknown>>(
	'TableData component was not found in the tree',
);

export function TableDataProvider<T = object>({
	children,
	value,
}: {
	value: TableDataContext<T>;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value as TableDataContext<unknown>}>{children}</Provider>;
}

export function useTableDataContext<T = object>(): TableDataContext<T> {
	return useContext() as TableDataContext<T>;
}
