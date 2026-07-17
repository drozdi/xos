import { memo, useMemo } from 'react';
import { useTableGroupingContext } from '../../context';
import { findGroupColumn } from '../../utils/column-fields';
import { getGroupedColumnForLevel } from '../../utils/group-by';
import type { TableBodyProps } from '../type';
import { TableBodyRow } from './row';

export * from './cell';
export * from './cell-expander';
export * from './cell-slot';
export * from './cell-wrap';
export * from './expand';
export * from './expander';
export * from './group';
export * from './grouped';
export * from './row';

export const TableBody = memo(function TableBody<T = object>({
	nodes,
	columns,
	level,
}: TableBodyProps<T>) {
	const { groupKeys, groupedHighlightLastRow } = useTableGroupingContext<T>();
	const group = useMemo(() => findGroupColumn(columns), [columns]);
	const grouped = useMemo(
		() => getGroupedColumnForLevel(columns, groupKeys, 0),
		[columns, groupKeys],
	);

	return (
		<>
			{nodes.map((node, index) => {
				const groupedVisual =
					groupedHighlightLastRow && index === nodes.length - 1
						? ('highlight-last' as const)
						: undefined;

				return (
					<TableBodyRow<T>
						node={node}
						columns={columns}
						key={node.expandKey ?? node.index}
						level={level}
						group={group}
						grouped={grouped}
						groupedVisual={groupedVisual}
					/>
				);
			})}
		</>
	);
}) as <T = object>(props: TableBodyProps<T>) => React.ReactNode;
