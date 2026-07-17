import { ActionIcon } from "@mantine/core";
import { TbCircleChevronLeft, TbCircleChevronRight } from 'react-icons/tb';
import { useTableGroupingContext, useTableExpandContext } from '../../context';
import type { ExpandKind } from '../../type';
import { getNodeExpandKey } from '../../utils/group-by';
import type { TableBodyExpanderProps } from '../type';

function resolveExpandKind<T>(column: TableBodyExpanderProps<T>['column']): ExpandKind {
	if (column.isGroup && !column.isGrouped) {
		return 'group';
	}
	return 'grouped';
}

export function TableBodyExpander<T = object>({
	node,
	column,
	kind: kindProp,
	onClick,
	...props
}: TableBodyExpanderProps<T>) {
	const { groupAt } = useTableGroupingContext<T>();
	const { isExpanded, toggleExpand } = useTableExpandContext();

	if (!column.isGroup && !column.isGrouped) {
		return null;
	}

	const kind = kindProp ?? resolveExpandKind(column);
	const expandKey = getNodeExpandKey(node);
	const isExpand = isExpanded(expandKey, kind);

	const ariaLabel = isExpand ? 'Свернуть группу' : 'Развернуть группу';

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
				onClick={() => {
					if (onClick) {
						onClick(node.index);
						return;
					}
					toggleExpand(expandKey, kind);
				}}
			>
				{groupAt === 'end' ? <TbCircleChevronLeft /> : <TbCircleChevronRight />}
			</ActionIcon>
	);
}
