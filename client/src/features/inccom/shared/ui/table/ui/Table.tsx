import { HoverCard, Table as TableMantine } from '@mantine/core';
import { useMemo } from 'react';
import { flattenBodyColumns } from '../utils/column-fields';
import { TableBody } from './body';
import { TableHeader } from './header';
import { TableHeaderToggling } from './TableHeaderToggling';
import type { TableProps } from './type';

export function Table<T = object>({
	withHeader = false,
	columns,
	visibleColumns, 
	nodes,
	level = 0,
	...props
}: TableProps<T>) {
	const isToggleable = useMemo(
		() => columns.some((column) => column.isToggleable),
		[columns],
	);

	const bodyColumns = useMemo(
		() => flattenBodyColumns(visibleColumns),
		[visibleColumns],
	);

	return (
		<TableMantine layout="fixed" {...props}>
			{withHeader && (
				<HoverCard disabled={!isToggleable} position="top">
					<HoverCard.Target>
						<TableMantine.Thead>
							<TableHeader<T> columns={visibleColumns} />
						</TableMantine.Thead>
					</HoverCard.Target>
					<HoverCard.Dropdown>
						<TableHeaderToggling columns={columns} />
					</HoverCard.Dropdown>
				</HoverCard>
			)}
			<TableMantine.Tbody>
				<TableBody<T> nodes={nodes} columns={bodyColumns} level={level} />
			</TableMantine.Tbody>
		</TableMantine>
	);
}
