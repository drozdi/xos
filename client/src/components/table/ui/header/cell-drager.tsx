import { ActionIcon } from '@mantine/core';
import {
	TbGripVertical
} from 'react-icons/tb';
import { isColumnReorderTarget } from '../../utils/column-fields';
import type { TableHeaderCellDragerProps } from '../type';

export function TableHeaderCellDrager<T = object>({
	column,
	...props
}: TableHeaderCellDragerProps<T>) {
	if (!column.isDraggable || !isColumnReorderTarget(column)) {
		return null;
	}
	return (
		<ActionIcon
			flex="0"
			role="img"
			variant="subtle"
			aria-label="Перетаскивание"
			title="Перетаскивание"
			{...props}
			style={{
				...props.style,
				cursor: 'move',
			}}
		>
			<TbGripVertical />
		</ActionIcon>
	);
}