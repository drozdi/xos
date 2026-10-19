import { memo, useMemo, type Ref } from 'react';
import { useTableGroupingContext } from '../../context';
import { useWindowedRows } from '../../hooks/use-windowed-rows';
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

function SpacerRow({
	ref,
	height,
	colSpan,
}: {
	ref?: Ref<HTMLTableRowElement>;
	height: number;
	colSpan: number;
}) {
	return (
		<tr ref={ref} aria-hidden style={{ height }}>
			<td colSpan={colSpan} style={{ padding: 0, border: 0 }} />
		</tr>
	);
}

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
	// Grouped/expandable rows have variable height and nested bodies — render them fully.
	const flat = !level && !group && !grouped && groupKeys.length === 0;
	const windowed = useWindowedRows(nodes.length, flat);
	const visibleNodes = windowed.active ? nodes.slice(windowed.start, windowed.end) : nodes;

	return (
		<>
			{windowed.active && (
				<>
					<SpacerRow height={0} colSpan={columns.length} />
					<SpacerRow ref={windowed.topSpacerRef} height={windowed.topHeight} colSpan={columns.length} />
				</>
			)}
			{visibleNodes.map((node, visibleIndex) => {
				const index = windowed.start + visibleIndex;
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
			{windowed.active && (
				<SpacerRow ref={windowed.bottomSpacerRef} height={windowed.bottomHeight} colSpan={columns.length} />
			)}
		</>
	);
}) as <T = object>(props: TableBodyProps<T>) => React.ReactNode;
