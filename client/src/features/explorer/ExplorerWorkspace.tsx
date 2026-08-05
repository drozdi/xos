import { ActionIcon, Box, Button, Group, Stack, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { queryKeys } from '@/core/api/queryKeys';
import { promptAction } from '@/core/confirm';

import { ExplorerPickerBar } from './components/ExplorerPickerBar';
import { ExplorerPathBar } from './components/ExplorerPathBar';
import { ConflictDialog, type ConflictPolicy, type ConflictState } from './components/ConflictDialog';
import { ExplorerFileList } from './components/ExplorerFileList';
import { ExplorerFooter } from './components/ExplorerFooter';
import { ExplorerToolbar } from './components/ExplorerToolbar';
import { ExplorerSidebar } from './components/ExplorerSidebar';
import { ExplorerUserDisksModal } from './ExplorerUserDisksModal';
import {
	copyExplorerItem,
	createExplorerFolder,
	deleteExplorerItem,
	emptyExplorerTrash,
	fetchExplorerConfig,
	fetchExplorerList,
	fetchExplorerTrash,
	isTargetExistsError,
	moveExplorerItem,
	packExplorerArchive,
	renameExplorerItem,
	restoreExplorerTrashItem,
	unpackExplorerArchive,
	uploadExplorerFile,
	type ExplorerEntry,
	type ExplorerSortBy,
	type ExplorerSortDir,
} from './explorerApi';
import { useExplorerClipboardStore } from './explorerClipboardStore';
import {
	createExplorerParentEntry,
	getExplorerFileName,
	getExplorerFolderPath,
	getExplorerParentPath,
	isExplorerParentEntry,
	joinExplorerDiskPath,
	joinExplorerPath,
	normalizeExplorerFolderPath,
	parseExplorerDisk,
} from './explorerPathUtils';
import {
	matchesExplorerPickerFilter,
	useExplorerPickerStore,
} from './explorerPickerStore';
import { useExplorerHistory } from './hooks/useExplorerHistory';
import { useExplorerSelection } from './hooks/useExplorerSelection';
import { getOpenWithAppsForEntry, openVfsPathWithApp } from './openWithRegistry';
import type { ExplorerViewMode } from './explorerViewUtils';

function parseDisk(path: string) {
	return parseExplorerDisk(path);
}

function resolveEntryPath(currentPath: string, entry: { path?: string; relativePath: string }): string {
	if (entry.path && /^[a-z0-9_-]+:\/\//i.test(entry.path)) {
		return entry.path;
	}
	const joined = joinExplorerDiskPath(currentPath, entry.relativePath);
	if (joined.endsWith('://')) {
		return joined;
	}
	return joined.replace(/\/$/, '');
}

interface ExplorerWorkspaceProps {
	initialPath?: string;
}

export function ExplorerWorkspace({ initialPath = 'home://' }: ExplorerWorkspaceProps) {
	const {
		currentPath,
		setCurrentPath,
		canGoBack,
		canGoForward,
		goBack,
		goForward,
	} = useExplorerHistory(initialPath);
	const [viewMode, setViewMode] = useState<'normal' | 'trash'>('normal');
	const [listViewMode, setListViewMode] = useState<ExplorerViewMode>('table');
	const [sortBy, setSortBy] = useState<ExplorerSortBy>('name');
	const [sortDir, setSortDir] = useState<ExplorerSortDir>('asc');
	const [newFolderOpened, { open: openNewFolder, close: closeNewFolder }] = useDisclosure(false);
	const [disksOpened, { open: openDisks, close: closeDisks }] = useDisclosure(false);
	const [newFolderName, setNewFolderName] = useState('');
	const [conflict, setConflict] = useState<ConflictState | null>(null);
	const [applyToAll, setApplyToAll] = useState(false);
	const [conflictQueue, setConflictQueue] = useState<Array<{ source: string; target: string; mode: 'copy' | 'move' }>>([]);
	const queryClient = useQueryClient();
	const clipboard = useExplorerClipboardStore((state) => state.clipboard);
	const setClipboard = useExplorerClipboardStore((state) => state.setClipboard);
	const picker = useExplorerPickerStore((state) => state.active);
	const completePicker = useExplorerPickerStore((state) => state.completePicker);
	const cancelPicker = useExplorerPickerStore((state) => state.cancelPicker);
	const [pickerFileName, setPickerFileName] = useState('');

	const diskRoot = `${parseDisk(currentPath)}://`;
	const isTrashView = viewMode === 'trash' && !picker;

	const configQuery = useQuery({
		queryKey: queryKeys.explorer.config,
		queryFn: fetchExplorerConfig,
	});

	const listQuery = useQuery({
		queryKey: isTrashView
			? queryKeys.explorer.trash(diskRoot)
			: queryKeys.explorer.list(currentPath, sortBy, sortDir),
		queryFn: () =>
			isTrashView ? fetchExplorerTrash(diskRoot).then((data) => ({ items: data.items })) : fetchExplorerList(currentPath, sortBy, sortDir),
	});

	const items = listQuery.data?.items ?? [];
	const displayItems = useMemo(() => {
		let list = items;
		if (picker?.mode === 'open') {
			list = items.filter((item) => matchesExplorerPickerFilter(item, picker));
		}

		const parentPath = getExplorerParentPath(currentPath);
		if (parentPath && !isTrashView) {
			return [createExplorerParentEntry(parentPath), ...list];
		}

		return list;
	}, [currentPath, isTrashView, items, picker]);

	const rows = useMemo(
		() =>
			displayItems.map((entry) => ({
				...entry,
				path: resolveEntryPath(currentPath, entry),
			})),
		[currentPath, displayItems],
	);

	const { selected, setSelected, handleSelect, clearSelection } = useExplorerSelection(rows);

	useEffect(() => {
		if (!picker) {
			setPickerFileName('');
			return;
		}

		setViewMode('normal');
		const startPath = picker.initialPath ? getExplorerFolderPath(picker.initialPath) : 'home://';
		setCurrentPath(startPath.endsWith('://') ? startPath : startPath.endsWith('/') ? startPath : `${startPath}/`);
		clearSelection();
		setPickerFileName(
			picker.defaultFileName ?? (picker.initialPath ? getExplorerFileName(picker.initialPath) : ''),
		);
	}, [picker?.id, clearSelection, setCurrentPath]);

	useEffect(() => {
		if (!picker || picker.mode !== 'save' || selected.length !== 1) {
			return;
		}
		const selectedPath = selected[0];
		const entry = rows.find((row) => row.path === selectedPath);
		if (entry && entry.type === 'file') {
			setPickerFileName(getExplorerFileName(selectedPath!));
		}
	}, [picker, rows, selected]);

	const invalidateCurrent = async () => {
		if (isTrashView) {
			await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.trash(diskRoot) });
			return;
		}
		await queryClient.invalidateQueries({ queryKey: queryKeys.explorer.list(currentPath, sortBy, sortDir) });
		await queryClient.invalidateQueries({ queryKey: ['explorer', 'tree'] });
	};

	const runTransfer = async (
		sourcePath: string,
		targetPath: string,
		mode: 'copy' | 'move',
		overwrite = false,
	) => {
		if (mode === 'copy') {
			await copyExplorerItem(sourcePath, targetPath, overwrite);
		} else {
			await moveExplorerItem(sourcePath, targetPath, overwrite);
		}
	};

	const processTransferQueue = async (
		queue: Array<{ source: string; target: string; mode: 'copy' | 'move' }>,
		startIndex = 0,
		defaultPolicy?: ConflictPolicy,
	) => {
		for (let index = startIndex; index < queue.length; index += 1) {
			const item = queue[index]!;
			try {
				await runTransfer(item.source, item.target, item.mode, defaultPolicy === 'replace');
			} catch (error) {
				if (!isTargetExistsError(error)) {
					throw error;
				}
				if (defaultPolicy === 'replace') {
					await runTransfer(item.source, item.target, item.mode, true);
					continue;
				}
				if (defaultPolicy === 'skip') {
					continue;
				}
				if (defaultPolicy === 'rename') {
					const renamed = `${item.target}-${Date.now()}`;
					await runTransfer(item.source, renamed, item.mode, false);
					continue;
				}
				setConflictQueue(queue);
				setConflict({
					source: item.source,
					target: item.target,
					message: 'Файл с таким именем уже существует.',
				});
				return;
			}
		}
		setConflictQueue([]);
		setConflict(null);
		await invalidateCurrent();
	};

	const pasteMutation = useMutation({
		mutationFn: async () => {
			if (!clipboard) {
				return;
			}
			const destBase = currentPath.endsWith('://') ? currentPath : `${currentPath.replace(/\/+$/, '')}/`;
			const queue = clipboard.paths.map((sourcePath) => {
				const name = sourcePath.split('/').pop() ?? 'item';
				return {
					source: sourcePath,
					target: `${destBase}${name}`,
					mode: clipboard.mode === 'copy' ? ('copy' as const) : ('move' as const),
				};
			});
			await processTransferQueue(queue);
		},
	});

	const mkdirMutation = useMutation({
		mutationFn: (name: string) => {
			const base = currentPath.endsWith('://') ? currentPath : `${currentPath.replace(/\/+$/, '')}/`;
			return createExplorerFolder(`${base}${name}`);
		},
		onSuccess: async () => {
			closeNewFolder();
			setNewFolderName('');
			await invalidateCurrent();
		},
	});

	const renameMutation = useMutation({
		mutationFn: ({ path, newName }: { path: string; newName: string }) => renameExplorerItem(path, newName),
		onSuccess: invalidateCurrent,
	});

	const deleteMutation = useMutation({
		mutationFn: (path: string) => deleteExplorerItem(path, isTrashView),
		onSuccess: async () => {
			clearSelection();
			await invalidateCurrent();
		},
	});

	const uploadMutation = useMutation({
		mutationFn: (file: File) => uploadExplorerFile(currentPath, file),
		onSuccess: invalidateCurrent,
	});

	const packMutation = useMutation({
		mutationFn: async (archiveName: string) => {
			const normalizedName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;
			const destBase = currentPath.endsWith('://') ? currentPath : `${currentPath.replace(/\/+$/, '')}/`;
			return packExplorerArchive(selected, `${destBase}${normalizedName}`);
		},
		onSuccess: async (result) => {
			if (!result) {
				return;
			}
			notifications.show({ message: 'Архив создан', color: 'green' });
			await invalidateCurrent();
		},
	});

	const unpackMutation = useMutation({
		mutationFn: async () => {
			const archivePath = selected[0];
			if (!archivePath) {
				return null;
			}
			const normalized = archivePath.replace(/\/+$/, '');
			const slash = normalized.lastIndexOf('/');
			const folder = slash >= 0 ? normalized.slice(0, slash + 1) : `${normalized}/`;
			const fileName = slash >= 0 ? normalized.slice(slash + 1) : normalized;
			return unpackExplorerArchive(archivePath, `${folder}${fileName.replace(/\.zip$/i, '')}/`);
		},
		onSuccess: async (result) => {
			if (!result) {
				return;
			}
			notifications.show({ message: `Распаковано: ${result.extracted}`, color: 'green' });
			await invalidateCurrent();
		},
	});

	const restoreMutation = useMutation({
		mutationFn: restoreExplorerTrashItem,
		onSuccess: async () => {
			clearSelection();
			await invalidateCurrent();
			notifications.show({ message: 'Восстановлено', color: 'green' });
		},
	});

	const emptyTrashMutation = useMutation({
		mutationFn: () => emptyExplorerTrash(diskRoot),
		onSuccess: async () => {
			clearSelection();
			await invalidateCurrent();
			notifications.show({ message: 'Корзина очищена', color: 'green' });
		},
	});

	const currentDisk = configQuery.data?.disks.find((disk) => disk.code === parseDisk(currentPath));

	const navigateTo = (path: string) => {
		setViewMode('normal');
		setCurrentPath(normalizeExplorerFolderPath(path));
		clearSelection();
	};

	const pickEntry = (entry: ExplorerEntry) => {
		if (!picker) {
			return;
		}

		const path = resolveEntryPath(currentPath, entry);
		if (entry.type === 'folder') {
			navigateTo(path);
			return;
		}

		if (picker.mode === 'open') {
			if (matchesExplorerPickerFilter(entry, picker)) {
				completePicker(path);
			}
			return;
		}

		setPickerFileName(getExplorerFileName(path));
		setSelected([path]);
	};

	const openEntry = async (entry: ExplorerEntry) => {
		if (isExplorerParentEntry(entry)) {
			const parent = getExplorerParentPath(currentPath);
			if (parent) {
				navigateTo(parent);
			}
			return;
		}

		const path = resolveEntryPath(currentPath, entry);

		if (picker) {
			pickEntry(entry);
			return;
		}

		if (entry.type === 'folder') {
			navigateTo(path);
			return;
		}
		const apps = getOpenWithAppsForEntry(entry);
		if (apps.length > 0) {
			await openVfsPathWithApp(apps[0]!, path, entry.name);
			return;
		}
		notifications.show({ message: 'Нет приложения для этого типа файла', color: 'yellow' });
	};

	const selectedFilePath =
		selected.find((path) => rows.find((row) => row.path === path && row.type === 'file')) ?? null;

	const handlePickerConfirm = () => {
		if (!picker) {
			return;
		}
		if (picker.mode === 'open') {
			if (selectedFilePath) {
				completePicker(selectedFilePath);
			}
			return;
		}
		const nextPath = joinExplorerPath(currentPath, pickerFileName);
		if (!pickerFileName.trim()) {
			return;
		}
		completePicker(nextPath);
	};

	const handleDelete = async () => {
		for (const path of selected) {
			await deleteMutation.mutateAsync(path);
		}
	};

	const handleRename = async () => {
		const path = selected[0];
		if (!path) {
			return;
		}
		const slash = path.lastIndexOf('/');
		const currentName = slash >= 0 ? path.slice(slash + 1) : path;
		const newName = await promptAction({
			title: 'Новое имя',
			defaultValue: currentName,
		});
		if (!newName) {
			return;
		}
		await renameMutation.mutateAsync({ path, newName });
	};

	const handlePack = async () => {
		const archiveName = await promptAction({
			title: 'Имя архива',
			defaultValue: 'archive.zip',
		});
		if (!archiveName) {
			return;
		}
		packMutation.mutate(archiveName);
	};

	const handleRestore = async () => {
		for (const path of selected) {
			await restoreMutation.mutateAsync(path);
		}
	};

	const handleConflictResolve = async (policy: ConflictPolicy) => {
		if (!conflict) {
			return;
		}
		const currentIndex = conflictQueue.findIndex((item) => item.target === conflict.target);
		const mode = conflictQueue[currentIndex]?.mode ?? 'copy';
		try {
			if (policy === 'replace') {
				await runTransfer(conflict.source, conflict.target, mode, true);
			} else if (policy === 'rename') {
				await runTransfer(conflict.source, `${conflict.target}-${Date.now()}`, mode, false);
			}
			const nextIndex = currentIndex + 1;
			if (applyToAll) {
				await processTransferQueue(conflictQueue, nextIndex, policy);
				return;
			}
			await processTransferQueue(conflictQueue, nextIndex);
		} catch {
			notifications.show({ message: 'Ошибка операции', color: 'red' });
		}
	};

	const menuActions = {
		open: openEntry,
		pick: pickEntry,
		copy: () => setClipboard({ mode: 'copy', paths: selected }),
		cut: () => setClipboard({ mode: 'cut', paths: selected }),
		paste: () => pasteMutation.mutate(),
		delete: () => void handleDelete(),
		rename: () => void handleRename(),
		pack: () => void handlePack(),
		unpack: () => unpackMutation.mutate(),
		restore: () => void handleRestore(),
		emptyTrash: () => emptyTrashMutation.mutate(),
		openWith: picker
			? () => undefined
			: (appId: string, path: string, name: string) => openVfsPathWithApp(appId, path, name),
	};

	return (
		<Stack h="100%" gap={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
			<ExplorerToolbar
				currentDiskCode={parseDisk(currentPath)}
				sortBy={sortBy}
				sortDir={sortDir}
				viewMode={listViewMode}
				pickerMode={Boolean(picker)}
				selectedCount={selected.length}
				clipboardCount={clipboard?.paths.length ?? 0}
				isTrashView={isTrashView}
				readOnly={Boolean(currentDisk?.readOnly)}
				isPending={pasteMutation.isPending || packMutation.isPending || unpackMutation.isPending}
				onDiskChange={navigateTo}
				onSortByChange={setSortBy}
				onSortDirChange={setSortDir}
				onViewModeChange={setListViewMode}
				onNewFolder={openNewFolder}
				onUpload={(file) => void uploadMutation.mutateAsync(file)}
				onCopy={menuActions.copy}
				onCut={menuActions.cut}
				onPaste={menuActions.paste}
				onDelete={menuActions.delete}
				onRename={menuActions.rename}
				onPack={menuActions.pack}
				onUnpack={menuActions.unpack}
				onOpenDisks={openDisks}
				onOpenTrash={() => {
					setViewMode('trash');
					clearSelection();
				}}
				onRestore={menuActions.restore}
				onEmptyTrash={menuActions.emptyTrash}
			/>

			{newFolderOpened && (
				<Group px="sm" py={4} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
					<TextInput
						size="xs"
						placeholder="Имя папки"
						value={newFolderName}
						onChange={(event) => setNewFolderName(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && newFolderName) {
								mkdirMutation.mutate(newFolderName);
							}
						}}
					/>
					<Button size="xs" onClick={() => newFolderName && mkdirMutation.mutate(newFolderName)} loading={mkdirMutation.isPending}>
						Создать
					</Button>
					<ActionIcon variant="subtle" onClick={closeNewFolder}>
						×
					</ActionIcon>
				</Group>
			)}

			<Box style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
				{!isTrashView && (
					<ExplorerSidebar
						disks={configQuery.data?.disks ?? []}
						currentPath={currentPath}
						onNavigate={navigateTo}
					/>
				)}
				<Box
					style={{
						flex: 1,
						minHeight: 0,
						minWidth: 0,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					<ExplorerPathBar
						path={currentPath}
						isTrashView={isTrashView}
						canGoBack={canGoBack}
						canGoForward={canGoForward}
						onBack={goBack}
						onForward={goForward}
						onNavigate={navigateTo}
					/>
					<ExplorerFileList
						items={displayItems}
						currentPath={currentPath}
						selected={selected}
						viewMode={listViewMode}
						pickerMode={Boolean(picker)}
						parseDisk={parseDisk}
						menuContext={{
							currentPath,
							isTrashView,
							readOnly: Boolean(currentDisk?.readOnly),
							pickerMode: Boolean(picker),
							pickerRequest: picker,
							actions: menuActions,
						}}
						onSelect={handleSelect}
						onOpen={openEntry}
					/>
				</Box>
			</Box>

			{picker ? (
				<ExplorerPickerBar
					mode={picker.mode}
					fileName={pickerFileName}
					selectedPath={selectedFilePath}
					onFileNameChange={setPickerFileName}
					onConfirm={handlePickerConfirm}
					onCancel={cancelPicker}
				/>
			) : (
				<ExplorerFooter
					itemCount={displayItems.length}
					selectedCount={selected.length}
					isLoading={listQuery.isLoading}
				/>
			)}

			<ExplorerUserDisksModal opened={disksOpened} onClose={closeDisks} />
			<ConflictDialog
				conflict={conflict}
				applyToAll={applyToAll}
				onApplyToAllChange={setApplyToAll}
				onResolve={(policy) => void handleConflictResolve(policy)}
				onClose={() => setConflict(null)}
			/>
		</Stack>
	);
}
