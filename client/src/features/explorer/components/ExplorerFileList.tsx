import { Box, ScrollArea, Table } from '@mantine/core';
import type { MouseEvent } from 'react';

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
	const rows = items.map((entry, index) => {
		const path = entry.path ?? `${parseDisk(currentPath)}://${entry.relativePath}`;
		return { entry, path, index };
	});

	const selectedEntries = rows.filter((row) => selected.includes(row.path)).map((row) => row.entry);

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
						selected={selected}
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
							{rows.map(({ entry, path, index }) => {
								const isSelected = selected.includes(path);
								return (
									<Table.Tr
										key={path}
										bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
										onClick={(event) => onSelect(path, index, event)}
										onDoubleClick={() => void onOpen(entry)}
									>
										<Table.Td>{isExplorerParentEntry(entry) ? '..' : entry.name}</Table.Td>
										<Table.Td>{entry.type === 'folder' ? 'Папка' : entry.fileType}</Table.Td>
										<Table.Td>{entry.type === 'folder' ? '—' : entry.size}</Table.Td>
										<Table.Td>{isExplorerParentEntry(entry) ? '—' : entry.permissions.join(', ')}</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				)}
			</ScrollArea>
		</Box>
	);
}
