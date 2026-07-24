import { Table } from 'antd';
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
		<div
			style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
			onContextMenu={onContextMenu}
		>
			{menu}
			<div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
				{viewMode === 'icons' ? (
					<ExplorerFileIconGrid
						rows={rows}
						selected={selected}
						onSelect={onSelect}
						onOpen={onOpen}
					/>
				) : (
					<Table
						size="small"
						pagination={false}
						rowKey={(row) => row.path}
						dataSource={rows}
						onRow={(row) => ({
							onClick: (event) => onSelect(row.path, row.index, event),
							onDoubleClick: () => void onOpen(row.entry),
							style: {
								background: selected.includes(row.path)
									? 'rgba(22, 119, 255, 0.1)'
									: undefined,
								cursor: 'pointer',
							},
						})}
						columns={[
							{
								title: 'Имя',
								dataIndex: 'entry',
								render: (entry: ExplorerEntry) =>
									isExplorerParentEntry(entry) ? '..' : entry.name,
							},
							{
								title: 'Тип',
								dataIndex: 'entry',
								render: (entry: ExplorerEntry) =>
									entry.type === 'folder' ? 'Папка' : entry.fileType,
							},
							{
								title: 'Размер',
								dataIndex: 'entry',
								render: (entry: ExplorerEntry) =>
									entry.type === 'folder' ? '—' : entry.size,
							},
							{
								title: 'Права',
								dataIndex: 'entry',
								render: (entry: ExplorerEntry) =>
									isExplorerParentEntry(entry) ? '—' : entry.permissions.join(', '),
							},
						]}
					/>
				)}
			</div>
		</div>
	);
}
