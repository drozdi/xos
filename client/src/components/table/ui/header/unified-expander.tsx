import { ActionIcon } from '@mantine/core';
import { TbCircleChevronLeft, TbCircleChevronRight } from 'react-icons/tb';
import { useTableExpandContext, useTableGroupingContext } from '../../context';
import type { TableHeaderCellExpanderProps } from '../type';

/** Один expander в заголовке unified-колонки (group + grouped): только kind group. */
export function TableHeaderCellUnifiedExpander<T = object>({
	column,
	...props
}: TableHeaderCellExpanderProps<T>) {
	const { groupAt, groupKeys } = useTableGroupingContext<T>();
	const { expandedSets, toggleExpand, expandables } = useTableExpandContext();

	if (!column.isGroup || !column.isGrouped) {
		return null;
	}

	if (groupKeys.indexOf(column.field as keyof T) === -1) {
		return null;
	}

	const levelKeys = expandables.group;
	if (!levelKeys.length) {
		return null;
	}

	const expandedCount = levelKeys.reduce(
		(count, key) => count + (expandedSets.group.has(key) ? 1 : 0),
		0,
	);
	const isExpand = expandedCount === levelKeys.length;
	const ariaLabel = isExpand ? 'Свернуть все списки' : 'Развернуть все списки';

	return (
		<ActionIcon
			variant="subtle"
			title={ariaLabel}
			aria-label={ariaLabel}
			{...props}
			style={{
				...props.style,
				transition: 'rotate 0.3s ease',
				rotate: isExpand ? (groupAt === 'end' ? '-90deg' : '90deg') : undefined,
			}}
			onClick={() => {
				if (isExpand) {
					toggleExpand(levelKeys, 'group', { remove: true });
				} else {
					toggleExpand(levelKeys, 'group', { merge: true });
				}
			}}
		>
			{groupAt === 'end' ? <TbCircleChevronLeft /> : <TbCircleChevronRight />}
		</ActionIcon>
	);
}
