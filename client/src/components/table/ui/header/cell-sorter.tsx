import { ActionIcon, Badge, Group } from '@mantine/core';
import {
	TbChevronDown,
	TbChevronUp,
	TbSelector
} from 'react-icons/tb';
import { useTableSortContext } from '../../context/TableSortContext';
import { resolveColumnSortField } from '../../utils/column-fields';
import type { TableHeaderCellSorterProps } from '../type';

export function TableHeaderCellSorter<T = object>({
	column,
	...props
}: TableHeaderCellSorterProps<T>) {
	const sortField = resolveColumnSortField(column);
	const { sort, changeSort, multiSort } = useTableSortContext<T>();

	if (!column.isSorted || !sortField) {
		return null;
	}

	const ruleIndex = sort.rules.findIndex((rule) => rule.key === sortField);
	const isSorted = ruleIndex !== -1;
	const isDescending = isSorted ? sort.rules[ruleIndex]!.descending : sort.descending;
	const sortPriority = isSorted && sort.rules.length > 1 ? ruleIndex + 1 : null;

	const ariaLabel = isSorted
		? `Отсортировано ${isDescending ? 'по убыванию' : 'по возрастанию'}${sortPriority ? ` (приоритет ${sortPriority})` : ''}`
		: multiSort
			? 'Нажмите для сортировки, Shift+клик — добавить поле'
			: 'Нажмите для сортировки';

	const handleClick = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (
			typeof column.sortable === 'function' &&
			column.sortable(column) === false
		) {
			return;
		}
		changeSort(sortField, { multi: event.shiftKey || multiSort });
	};

	return (
		<Group gap={2} wrap="nowrap">
			{sortPriority !== null && (
				<Badge size="xs" variant="light" circle>
					{sortPriority}
				</Badge>
			)}
			<ActionIcon
				{...props}
				variant="subtle"
				flex="0"
				onClick={handleClick}
				title={ariaLabel}
				aria-label={ariaLabel}
			>
				{isSorted ? isDescending ? <TbChevronDown /> : <TbChevronUp /> : <TbSelector />}
			</ActionIcon>
		</Group>
	);
}
