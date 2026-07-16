import { ActionIcon } from '@mantine/core';
import { TbCircleChevronLeft, TbCircleChevronRight } from 'react-icons/tb';
import { useTableGroupingContext, useTableExpandContext } from '../../context';
import {
	canExpandGroupedNode,
	getNodeExpandKey,
	hasGroupNestedData,
	isUnifiedGroupColumn,
} from '../../utils/group-by';
import type { TableBodyExpanderProps } from '../type';

/** Один expander для колонки group + grouped на одном field (список из node.nodes). */
export function TableBodyUnifiedExpander<T = object>({
	node,
	column,
	...props
}: TableBodyExpanderProps<T>) {
	const { groupAt, groupKeys } = useTableGroupingContext<T>();
	const { isExpanded, toggleExpand } = useTableExpandContext();

	const isUnified = isUnifiedGroupColumn(column);
	const canExpand = isUnified
		? canExpandGroupedNode(node, groupKeys)
		: (column.isGrouped && canExpandGroupedNode(node, groupKeys)) ||
			(column.isGroup && hasGroupNestedData(node, column));

	if (!canExpand) {
		return null;
	}

	const expandKey = getNodeExpandKey(node);
	const kind = isUnified ? 'group' : column.isGrouped ? 'grouped' : 'group';
	const isExpand = isExpanded(expandKey, kind);

	const ariaLabel = isExpand ? 'Свернуть список' : 'Развернуть список';

	return (
		<ActionIcon
			flex={0}
			variant="subtle"
			role="button"
			title={ariaLabel}
			aria-label={ariaLabel}
			{...props}
			style={{
				...props.style,
				transition: 'rotate 0.3s ease',
				rotate:
					isExpand && groupAt === 'end' ? '-90deg' : isExpand ? '90deg' : undefined,
			}}
			onClick={() => toggleExpand(expandKey, kind)}
		>
			{groupAt === 'end' ? <TbCircleChevronLeft /> : <TbCircleChevronRight />}
		</ActionIcon>
	);
}
