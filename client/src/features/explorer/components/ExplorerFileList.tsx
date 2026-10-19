import { Box, ScrollArea, Table } from '@mantine/core';
import { memo, useMemo, type MouseEvent, type Ref } from 'react';

import { useWindowedRows } from '@/components/table/hooks/use-windowed-rows';

import type { ExplorerEntry } from '../explorerApi';
import { isExplorerParentEntry } from '../explorerPathUtils';
import type { ExplorerViewMode } from '../explorerViewUtils';
import { useExplorerContextMenu } from '../hooks/useExplorerContextMenu';
import type { ExplorerMenuContext } from '../contextMenu/explorerMenuItems';

import { ExplorerFileIconGrid } from './ExplorerFileIconGrid';

interface ExplorerFileListProps {
	items: ExplorerEntry[];
	currentPath: string;
	selected: string[];
	viewMode: ExplorerViewMode;
	pickerMode?: boolean;
	parseDisk: (path: string) => string;
	menuContext: Omit<ExplorerMenuContext, 'selectedEntries' | 'selectedPaths'>;
	onSelect: (path: string, index: number, event: MouseEvent) => void;
	onOpen: (entry: ExplorerEntry) => void | Promise<void>;
}

const COLUMN_COUNT = 4;

function SpacerRow({ ref, height }: { ref?: Ref<HTMLTableRowElement>; height: number }) {
	return (
		<tr ref={ref} aria-hidden style={{ height }}>
			<td colSpan={COLUMN_COUNT} style={{ padding: 0, border: 0 }} />
		</tr>
	);
}

const ExplorerFileRow = memo(({
	entry,
	path,
	index,
	selected,
	onSelect,
	onOpen,
}: {
	entry: ExplorerEntry;
	path: string;
	index: number;
	selected: boolean;
	onSelect: ExplorerFileListProps['onSelect'];
	onOpen: ExplorerFileListProps['onOpen'];
}) => {
	const isParent = isExplorerParentEntry(entry);
	return (
		<Table.Tr
			bg={selected ? 'var(--mantine-color-blue-light)' : undefined}
			onClick={(event) => onSelect(path, index, event)}
			onDoubleClick={() => void onOpen(entry)}
		>
			<Table.Td>{isParent ? '..' : entry.name}</Table.Td>
			<Table.Td>{entry.type === 'folder' ? 'Папка' : entry.fileType}</Table.Td>
			<Table.Td>{entry.type === 'folder' ? '—' : entry.size}</Table.Td>
			<Table.Td>{isParent ? '—' : entry.permissions.join(', ')}</Table.Td>
		</Table.Tr>
	);
});

export function ExplorerFileList({
	items,
	currentPath,
	selected,
	viewMode,
	pickerMode = false,
	parseDisk,
	menuContext,
	onSelect,
	onOpen,
}: ExplorerFileListProps) {
	const rows = useMemo(() => {
		const disk = parseDisk(currentPath);
		return items.map((entry, index) => ({
			entry,
			path: entry.path ?? `${disk}://${entry.relativePath}`,
			index,
		}));
	}, [items, currentPath, parseDisk]);

	const selectedSet = useMemo(() => new Set(selected), [selected]);
	const selectedEntries = useMemo(
		() => rows.filter((row) => selectedSet.has(row.path)).map((row) => row.entry),
		[rows, selectedSet],
	);
	const windowed = useWindowedRows(rows.length, viewMode !== 'icons');
	const visibleRows = windowed.active ? rows.slice(windowed.start, windowed.end) : rows;

	const { onContextMenu, menu } = useExplorerContextMenu({
		...menuContext,
		selectedPaths: selected,
		selectedEntries,
	});

	return (
		<Box
			style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
			onContextMenu={onContextMenu}
		>
			{menu}
			<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
				{viewMode === 'icons' ? (
					<ExplorerFileIconGrid
						rows={rows}
						selected={selectedSet}
						onSelect={onSelect}
						onOpen={onOpen}
					/>
				) : (
					<Table highlightOnHover striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Имя</Table.Th>
								<Table.Th>Тип</Table.Th>
								<Table.Th>Размер</Table.Th>
								<Table.Th>Права</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{windowed.active && (
								<>
									<SpacerRow height={0} />
									<SpacerRow ref={windowed.topSpacerRef} height={windowed.topHeight} />
								</>
							)}
							{visibleRows.map(({ entry, path, index }) => (
								<ExplorerFileRow
									key={path}
									entry={entry}
									path={path}
									index={index}
									selected={selectedSet.has(path)}
									onSelect={onSelect}
									onOpen={onOpen}
								/>
							))}
							{windowed.active && (
								<SpacerRow ref={windowed.bottomSpacerRef} height={windowed.bottomHeight} />
							)}
						</Table.Tbody>
					</Table>
				)}
			</ScrollArea>
		</Box>
	);
}
