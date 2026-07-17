import { createSafeContext } from '../../../internal/utils/create-safe-context';
import type { ExpandKind, TableExpandablesState, TableExpandsState, ToggleExpandOptions } from '../type';

export interface TableExpandedSets {
	group: Set<string>;
	grouped: Set<string>;
}

export interface TableExpandContext {
	expands: TableExpandsState;
	expandedSets: TableExpandedSets;
	isExpanded: (expandKey: string, kind: ExpandKind) => boolean;
	toggleExpand: (
		expandKey: string | string[],
		kind: ExpandKind,
		options?: ToggleExpandOptions,
	) => void;
	expandables: TableExpandablesState;
}

const [Provider, useContext] = createSafeContext<TableExpandContext>(
	'TableExpandContext was not found in the tree',
);

export function TableExpandProvider({
	children,
	value,
}: {
	value: TableExpandContext;
	children: React.ReactNode;
}): React.ReactNode {
	return <Provider value={value}>{children}</Provider>;
}

export function useTableExpandContext(): TableExpandContext {
	return useContext();
}
