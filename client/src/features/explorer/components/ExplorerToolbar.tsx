import {
	ActionIcon,
	Divider,
	Group,
	Menu,
	Tooltip,
} from '@mantine/core';
import {
	IconArchive,
	IconArrowBackUp,
	IconArrowsSort,
	IconClipboard,
	IconCopy,
	IconCut,
	IconDatabase,
	IconFileZip,
	IconFolderPlus,
	IconLayoutGrid,
	IconList,
	IconPencil,
	IconTrash,
	IconTrashOff,
	IconTrashX,
	IconUpload,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

import type { ExplorerSortBy, ExplorerSortDir } from '../explorerApi';
import type { ExplorerViewMode } from '../explorerViewUtils';
import { useCanArchiveExplorer, useCanDeleteExplorer, useCanWriteExplorer } from '../explorerAccess';

interface ExplorerToolbarProps {
	sortBy: ExplorerSortBy;
	sortDir: ExplorerSortDir;
	viewMode: ExplorerViewMode;
	pickerMode?: boolean;
	selectedCount: number;
	clipboardCount: number;
	isTrashView: boolean;
	readOnly: boolean;
	isPending: boolean;
	onDiskChange: (diskRoot: string) => void;
	currentDiskCode: string;
	onSortByChange: (value: ExplorerSortBy) => void;
	onSortDirChange: (value: ExplorerSortDir) => void;
	onViewModeChange: (value: ExplorerViewMode) => void;
	onNewFolder: () => void;
	onUpload: (file: File) => void;
	onCopy: () => void;
	onCut: () => void;
	onPaste: () => void;
	onDelete: () => void;
	onRename: () => void;
	onPack: () => void;
	onUnpack: () => void;
	onOpenDisks: () => void;
	onOpenTrash: () => void;
	onRestore: () => void;
	onEmptyTrash: () => void;
}

function ToolbarIcon({
	label,
	disabled,
	loading,
	color,
	onClick,
	children,
}: {
	label: string;
	disabled?: boolean;
	loading?: boolean;
	color?: string;
	onClick?: () => void;
	children: ReactNode;
}) {
	return (
		<Tooltip label={label} withArrow>
			<ActionIcon
				variant="subtle"
				size="md"
				disabled={disabled}
				loading={loading}
				color={color}
				onClick={onClick}
				aria-label={label}
			>
				{children}
			</ActionIcon>
		</Tooltip>
	);
}

export function ExplorerToolbar({
	currentDiskCode,
	sortBy,
	sortDir,
	viewMode,
	pickerMode = false,
	selectedCount,
	clipboardCount,
	isTrashView,
	readOnly,
	isPending,
	onDiskChange,
	onSortByChange,
	onSortDirChange,
	onViewModeChange,
	onNewFolder,
	onUpload,
	onCopy,
	onCut,
	onPaste,
	onDelete,
	onRename,
	onPack,
	onUnpack,
	onOpenDisks,
	onOpenTrash,
	onRestore,
	onEmptyTrash,
}: ExplorerToolbarProps) {
	const canWrite = useCanWriteExplorer();
	const canDelete = useCanDeleteExplorer();
	const canArchive = useCanArchiveExplorer();
	const writable = canWrite && !readOnly;

	const sortLabel = `Сортировка: ${sortBy === 'name' ? 'имя' : sortBy === 'size' ? 'размер' : 'тип'}, ${sortDir === 'asc' ? '↑' : '↓'}`;

	return (
		<Group
			gap={4}
			px="sm"
			py={6}
			wrap="nowrap"
			style={{
				borderBottom: '1px solid var(--mantine-color-default-border)',
				flexShrink: 0,
			}}
		>
			{!pickerMode && !isTrashView && (
				<>
					<ToolbarIcon label="Новая папка" disabled={!writable} onClick={onNewFolder}>
						<IconFolderPlus size={18} />
					</ToolbarIcon>
					<Tooltip label="Загрузить файл">
						<ActionIcon variant="subtle" size="md" disabled={!writable} component="label" aria-label="Загрузить файл">
							<IconUpload size={18} />
							<input
								type="file"
								hidden
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) {
										onUpload(file);
									}
									event.currentTarget.value = '';
								}}
							/>
						</ActionIcon>
					</Tooltip>
					<Divider orientation="vertical" />
					<ToolbarIcon label="Копировать" disabled={selectedCount === 0} onClick={onCopy}>
						<IconCopy size={18} />
					</ToolbarIcon>
					<ToolbarIcon label="Вырезать" disabled={selectedCount === 0 || !writable} onClick={onCut}>
						<IconCut size={18} />
					</ToolbarIcon>
					<ToolbarIcon
						label={clipboardCount > 0 ? `Вставить (${clipboardCount})` : 'Вставить'}
						disabled={clipboardCount === 0 || !writable}
						loading={isPending}
						onClick={onPaste}
					>
						<IconClipboard size={18} />
					</ToolbarIcon>
					<ToolbarIcon label="Переименовать" disabled={selectedCount !== 1 || !writable} onClick={onRename}>
						<IconPencil size={18} />
					</ToolbarIcon>
					{canArchive && (
						<>
							<ToolbarIcon
								label="Создать ZIP"
								disabled={selectedCount === 0 || !writable}
								loading={isPending}
								onClick={onPack}
							>
								<IconFileZip size={18} />
							</ToolbarIcon>
							<ToolbarIcon
								label="Распаковать"
								disabled={selectedCount !== 1 || !writable}
								loading={isPending}
								onClick={onUnpack}
							>
								<IconArchive size={18} />
							</ToolbarIcon>
						</>
					)}
					{canDelete && (
						<ToolbarIcon
							label="Удалить"
							disabled={selectedCount === 0 || !writable}
							color="orange"
							onClick={onDelete}
						>
							<IconTrash size={18} />
						</ToolbarIcon>
					)}
					<ToolbarIcon label="Корзина" onClick={onOpenTrash}>
						<IconTrashX size={18} />
					</ToolbarIcon>
				</>
			)}

			{!pickerMode && isTrashView && (
				<>
					<ToolbarIcon label="Восстановить" disabled={selectedCount === 0 || !canDelete} onClick={onRestore}>
						<IconArrowBackUp size={18} />
					</ToolbarIcon>
					<ToolbarIcon label="Очистить корзину" disabled={!canDelete} color="red" onClick={onEmptyTrash}>
						<IconTrashOff size={18} />
					</ToolbarIcon>
					<ToolbarIcon label="Назад к диску" onClick={() => onDiskChange(`${currentDiskCode}://`)}>
						<IconArrowBackUp size={18} style={{ transform: 'scaleX(-1)' }} />
					</ToolbarIcon>
				</>
			)}

			<Group gap={4} ml="auto" wrap="nowrap">
				<Tooltip label="Таблица" withArrow>
					<ActionIcon
						variant={viewMode === 'table' ? 'light' : 'subtle'}
						size="md"
						color={viewMode === 'table' ? 'blue' : 'gray'}
						onClick={() => onViewModeChange('table')}
						aria-label="Таблица"
					>
						<IconList size={18} />
					</ActionIcon>
				</Tooltip>
				<Tooltip label="Значки" withArrow>
					<ActionIcon
						variant={viewMode === 'icons' ? 'light' : 'subtle'}
						size="md"
						color={viewMode === 'icons' ? 'blue' : 'gray'}
						onClick={() => onViewModeChange('icons')}
						aria-label="Значки"
					>
						<IconLayoutGrid size={18} />
					</ActionIcon>
				</Tooltip>
				<Divider orientation="vertical" />
				<Menu withinPortal position="bottom-end">
					<Menu.Target>
						<Tooltip label={sortLabel}>
							<ActionIcon variant="subtle" size="md" aria-label={sortLabel}>
								<IconArrowsSort size={18} />
							</ActionIcon>
						</Tooltip>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Сортировать по</Menu.Label>
						<Menu.Item onClick={() => onSortByChange('name')}>Имя {sortBy === 'name' ? '✓' : ''}</Menu.Item>
						<Menu.Item onClick={() => onSortByChange('size')}>Размер {sortBy === 'size' ? '✓' : ''}</Menu.Item>
						<Menu.Item onClick={() => onSortByChange('type')}>Тип {sortBy === 'type' ? '✓' : ''}</Menu.Item>
						<Menu.Divider />
						<Menu.Item onClick={() => onSortDirChange('asc')}>По возрастанию {sortDir === 'asc' ? '✓' : ''}</Menu.Item>
						<Menu.Item onClick={() => onSortDirChange('desc')}>По убыванию {sortDir === 'desc' ? '✓' : ''}</Menu.Item>
					</Menu.Dropdown>
				</Menu>
				{!pickerMode && (
					<ToolbarIcon label="Управление дисками" onClick={onOpenDisks}>
						<IconDatabase size={18} />
					</ToolbarIcon>
				)}
			</Group>
		</Group>
	);
}
