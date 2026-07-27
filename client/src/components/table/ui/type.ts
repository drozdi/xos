import type {
	ActionIconProps,
	BoxProps,
	TableProps as TableMantineProps,
} from '@mantine/core';
import type { ColumnEntity, ExpandKind, TableNode } from '../type';

export interface TableProps<T = object> extends Omit<TableMantineProps, 'children'> {
	withHeader?: boolean;
	nodes: TableNode<T>[];
	columns: ColumnEntity<T>[];
	visibleColumns: ColumnEntity<T>[];
	level?: number;
}

export interface TableBodyProps<T = object> {
	nodes: TableNode<T>[];
	columns: ColumnEntity<T>[];
	group?: ColumnEntity<T>;
	grouped?: ColumnEntity<T>;
	level?: number;
}

export interface TablePaginationProps<T = object> extends BoxProps {
	page: string | number;
	total: number;
	limit?: number;
	limits?: number[];
	nextLabel?: React.ReactNode;
	previousLabel?: React.ReactNode;
	loading?: boolean;
	activePprevious?: boolean;
	activeNext?: boolean;
	onNext?: () => void;
	onPprevious?: () => void;
	onChangeLimit?: (limit: number) => void;
	onChangePage?: (page: number) => void;
}

export interface TableHeaderCellBase<T = object> {
	column: ColumnEntity<T>;
}
export interface TableHeaderCellSlotProps<T = object> extends TableHeaderCellBase<T> {}
export interface TableHeaderCellActionProps<T = object>
	extends TableHeaderCellBase<T>, ActionIconProps {}
export interface TableHeaderCellBoxProps<T = object> extends TableHeaderCellBase<T>, BoxProps {}
export type TableHeaderCellExpanderProps<T = object> = TableHeaderCellActionProps<T> & {
	kind?: ExpandKind;
};
export type TableHeaderCellDragerProps<T = object> = TableHeaderCellActionProps<T>
export type TableHeaderCellTogglerProps<T = object> = TableHeaderCellActionProps<T>
export type TableHeaderCellSorterProps<T = object> = TableHeaderCellActionProps<T>;
export type TableHeaderCellResizerProps<T = object> = TableHeaderCellBoxProps<T>;
export interface TableHeaderCellWrapProps<T = object> extends TableHeaderCellBase<T> {
	maxRow: number;
	maxCol: number;
	children?: React.ReactNode;
	className?: string;
}
export interface TableHeaderCellProps<T = object> extends TableHeaderCellWrapProps<T> {}
export interface TableHeaderCellGroupProps<T = object>
	extends TableHeaderCellExpanderProps<T>, TableHeaderCellWrapProps<T> {}



export interface TableHeaderProps<T = object> {
	columns: ColumnEntity<T>[];
}

export type TableEmptyProps = React.PropsWithChildren<{
	Icon?: React.FC<any> | undefined;
	text?: string;
}>;

export interface TableBodyRowProps<T = object> {
	node: TableNode<T>;
	columns: ColumnEntity<T>[];
	group?: ColumnEntity<T>;
	grouped?: ColumnEntity<T>;
	level?: number;
	/** Визуальное выделение последней строки раскрытой grouped-группы. */
	groupedVisual?: 'highlight-last';
}

export interface TableBodyGroupedProps<T = object> {
	node: TableNode<T>;
	columns: ColumnEntity<T>[];
	column: ColumnEntity<T>;
	level?: number;
}

export interface TableBodyGroupProps<T = object> {
	node: TableNode<T>;
	columns: ColumnEntity<T>[];
	column: ColumnEntity<T>;
	level?: number;
}

export interface TableBodyCellBaseProps<T = object> {
	node: TableNode<T>;
	column: ColumnEntity<T>;
}

export interface TableBodyExpanderProps<T = object> extends TableBodyCellBaseProps<T>, ActionIconProps {
	kind?: ExpandKind;
	onClick?: (index: TableNode<T>['index']) => void;
}

export interface TableBodyCellWrapProps<T = object> {
	node: TableNode<T>;
	column: ColumnEntity<T>;
	columns?: ColumnEntity<T>[];
	columnIndex?: number;
	children?: React.ReactNode;
	onClick?: () => void;
	level?: number;
	className?: string;
	/** Без обёртки Group — для комбинированной group+grouped ячейки с собственным layout. */
	plain?: boolean;
}

export interface TableBodyCellSlotProps<T = object> extends TableBodyCellBaseProps<T> {
	columns?: ColumnEntity<T>[];
	/** Последняя строка в раскрытом grouped-блоке (└ вместо ├). */
	isLastInGroupedBlock?: boolean;
}

export interface TableBodyCellProps<T = object> extends TableBodyCellBaseProps<T> {
	columns?: ColumnEntity<T>[];
	columnIndex?: number;
	level?: number;
	isLastInGroupedBlock?: boolean;
}

export interface TableBodyCellExpandProps<T = object> extends TableBodyCellBaseProps<T> {
	columns?: ColumnEntity<T>[];
	columnIndex?: number;
	level?: number;
}

export interface TableBodyCellExpanderProps<T = object> extends TableBodyCellBaseProps<T> {}