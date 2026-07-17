import { ActionIcon } from '@mantine/core';
import { useCallback } from 'react';
import {
	TbX
} from 'react-icons/tb';
import { useTableColumnMetaContext } from '../../context/TableColumnMetaContext';
import type { TableHeaderCellTogglerProps } from '../type';

export function TableHeaderCellToggler<T = object>({
	column,
	...props
}: TableHeaderCellTogglerProps<T>) {
	const { toggleColumn, hiddenColumns } = useTableColumnMetaContext<T>();

	if (!column.isToggleable || !column.field) {
		return null;
	}
	const isHidden = hiddenColumns.includes(column.field as keyof T);

	const handleClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			event.preventDefault();
			event.stopPropagation();
			if (
				typeof column.toggleable === 'function' &&
				column.toggleable(column) === false
			) {
				return;
			}
			toggleColumn(column);
		},
		[column, toggleColumn],
	);

	return (
		<ActionIcon
			variant="subtle"
			size="xs"
			role="img"
			aria-label={isHidden ? 'Show column' : 'Hide column'}
			title={isHidden ? 'Показать колонку' : 'Скрыть колонку'}
			{...props}
			onClick={handleClick}
		>
			<TbX />
		</ActionIcon>
	);
}