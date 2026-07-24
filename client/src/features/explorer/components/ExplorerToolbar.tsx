import { Button, Divider, Dropdown, Flex, Tooltip } from 'antd';
import {
	AppstoreOutlined,
	CopyOutlined,
	DatabaseOutlined,
	DeleteOutlined,
	EditOutlined,
	FileZipOutlined,
	FolderAddOutlined,
	InboxOutlined,
	ReloadOutlined,
	ScissorOutlined,
	SnippetsOutlined,
	SortAscendingOutlined,
	UndoOutlined,
	UnorderedListOutlined,
	UploadOutlined,
} from '@ant-design/icons';
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
	danger,
	onClick,
	children,
}: {
	label: string;
	disabled?: boolean;
	loading?: boolean;
	danger?: boolean;
	onClick?: () => void;
	children: ReactNode;
}) {
	return (
		<Tooltip title={label}>
			<Button
				type="text"
				size="middle"
				disabled={disabled}
				loading={loading}
				danger={danger}
				onClick={onClick}
				aria-label={label}
				icon={<>{children}</>}
			/>
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
		<Flex
			gap={4}
			wrap="nowrap"
			align="center"
			style={{
				padding: '6px 12px',
				borderBottom: '1px solid var(--xos-shell-border)',
				flexShrink: 0,
			}}
		>
			{!pickerMode && !isTrashView ? (
				<>
					<ToolbarIcon label="Новая папка" disabled={!writable} onClick={onNewFolder}>
						<FolderAddOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<Tooltip title="Загрузить файл">
						<Button
							type="text"
							size="middle"
							disabled={!writable}
							aria-label="Загрузить файл"
							icon={<UploadOutlined style={{ fontSize: 18 }} />}
							onClick={() => {
								const input = document.createElement('input');
								input.type = 'file';
								input.onchange = () => {
									const file = input.files?.[0];
									if (file) {
										onUpload(file);
									}
								};
								input.click();
							}}
						/>
					</Tooltip>
					<Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
					<ToolbarIcon label="Копировать" disabled={selectedCount === 0} onClick={onCopy}>
						<CopyOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<ToolbarIcon label="Вырезать" disabled={selectedCount === 0 || !writable} onClick={onCut}>
						<ScissorOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<ToolbarIcon
						label={clipboardCount > 0 ? `Вставить (${clipboardCount})` : 'Вставить'}
						disabled={clipboardCount === 0 || !writable}
						loading={isPending}
						onClick={onPaste}
					>
						<SnippetsOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<ToolbarIcon label="Переименовать" disabled={selectedCount !== 1 || !writable} onClick={onRename}>
						<EditOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					{canArchive ? (
						<>
							<ToolbarIcon
								label="Создать ZIP"
								disabled={selectedCount === 0 || !writable}
								loading={isPending}
								onClick={onPack}
							>
								<FileZipOutlined style={{ fontSize: 18 }} />
							</ToolbarIcon>
							<ToolbarIcon
								label="Распаковать"
								disabled={selectedCount !== 1 || !writable}
								loading={isPending}
								onClick={onUnpack}
							>
								<InboxOutlined style={{ fontSize: 18 }} />
							</ToolbarIcon>
						</>
					) : null}
					{canDelete ? (
						<ToolbarIcon
							label="Удалить"
							disabled={selectedCount === 0 || !writable}
							danger
							onClick={onDelete}
						>
							<DeleteOutlined style={{ fontSize: 18 }} />
						</ToolbarIcon>
					) : null}
					<ToolbarIcon label="Корзина" onClick={onOpenTrash}>
						<DeleteOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
				</>
			) : null}

			{!pickerMode && isTrashView ? (
				<>
					<ToolbarIcon label="Восстановить" disabled={selectedCount === 0 || !canDelete} onClick={onRestore}>
						<UndoOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<ToolbarIcon label="Очистить корзину" disabled={!canDelete} danger onClick={onEmptyTrash}>
						<ReloadOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
					<ToolbarIcon label="Назад к диску" onClick={() => onDiskChange(`${currentDiskCode}://`)}>
						<UndoOutlined style={{ fontSize: 18, transform: 'scaleX(-1)' }} />
					</ToolbarIcon>
				</>
			) : null}

			<Flex gap={4} wrap="nowrap" style={{ marginLeft: 'auto' }}>
				<Tooltip title="Таблица">
					<Button
						type={viewMode === 'table' ? 'primary' : 'text'}
						ghost={viewMode === 'table'}
						size="middle"
						onClick={() => onViewModeChange('table')}
						aria-label="Таблица"
						icon={<UnorderedListOutlined style={{ fontSize: 18 }} />}
					/>
				</Tooltip>
				<Tooltip title="Значки">
					<Button
						type={viewMode === 'icons' ? 'primary' : 'text'}
						ghost={viewMode === 'icons'}
						size="middle"
						onClick={() => onViewModeChange('icons')}
						aria-label="Значки"
						icon={<AppstoreOutlined style={{ fontSize: 18 }} />}
					/>
				</Tooltip>
				<Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
				<Dropdown
					menu={{
						items: [
							{
								key: 'name',
								label: `Имя ${sortBy === 'name' ? '✓' : ''}`,
								onClick: () => onSortByChange('name'),
							},
							{
								key: 'size',
								label: `Размер ${sortBy === 'size' ? '✓' : ''}`,
								onClick: () => onSortByChange('size'),
							},
							{
								key: 'type',
								label: `Тип ${sortBy === 'type' ? '✓' : ''}`,
								onClick: () => onSortByChange('type'),
							},
							{ type: 'divider' },
							{
								key: 'asc',
								label: `По возрастанию ${sortDir === 'asc' ? '✓' : ''}`,
								onClick: () => onSortDirChange('asc'),
							},
							{
								key: 'desc',
								label: `По убыванию ${sortDir === 'desc' ? '✓' : ''}`,
								onClick: () => onSortDirChange('desc'),
							},
						],
					}}
					trigger={['click']}
					placement="bottomRight"
				>
					<Tooltip title={sortLabel}>
						<Button type="text" size="middle" aria-label={sortLabel} icon={<SortAscendingOutlined style={{ fontSize: 18 }} />} />
					</Tooltip>
				</Dropdown>
				{!pickerMode ? (
					<ToolbarIcon label="Управление дисками" onClick={onOpenDisks}>
						<DatabaseOutlined style={{ fontSize: 18 }} />
					</ToolbarIcon>
				) : null}
			</Flex>
		</Flex>
	);
}
