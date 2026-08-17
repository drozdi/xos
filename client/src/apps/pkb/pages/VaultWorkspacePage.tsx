import { Alert, Box, Button, Group, Loader, ScrollArea, SegmentedControl, Stack, Text } from '@mantine/core';

import { IconArrowLeft, IconCalendar, IconFilePlus, IconReplace, IconUsers } from '@tabler/icons-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCallback, useMemo, useRef, useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

import { BacklinksPanel } from '@/features/pkb/components/BacklinksPanel';

import { BookmarksPanel } from '@/features/pkb/components/BookmarksPanel';

import { GraphView } from '@/features/pkb/components/GraphView';

import { IndexStaleIndicator } from '@/features/pkb/components/IndexStaleIndicator';

import { NewFromTemplateModal } from '@/features/pkb/components/NewFromTemplateModal';

import { NoteEditorPanel } from '@/features/pkb/components/NoteEditorPanel';

import { SearchReplaceModal } from '@/features/pkb/components/SearchReplaceModal';

import { VaultFileTree } from '@/features/pkb/components/VaultFileTree';

import { VaultSearchBar } from '@/features/pkb/components/VaultSearchBar';

import { ShareVaultModal } from '@/features/pkb/ShareVaultModal';

import { resolveDailyNotePath } from '@/features/pkb/dailyNotes';

import { usePkbUiPrefs } from '@/features/pkb/hooks/usePkbUiPrefs';

interface VaultWorkspacePageProps {
	vaultId: number;
	onBack: () => void;
}

type WorkspaceView = 'editor' | 'graph';

const RIGHT_PANEL_WIDTH = 240;

function isMarkdownFile(path: string): boolean {
	return /\.(md|markdown|mdown)$/i.test(path);
}

function expandFoldersForPath(path: string): string[] {
	const parts = path.split('/');
	const folders = [''];
	for (let index = 0; index < parts.length - 1; index += 1) {
		folders.push(parts.slice(0, index + 1).join('/'));
	}
	return folders;
}

export function VaultWorkspacePage({ vaultId, onBack }: VaultWorkspacePageProps) {
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['']));
	const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('editor');
	const [shareOpened, setShareOpened] = useState(false);
	const [templateOpened, setTemplateOpened] = useState(false);
	const [searchReplaceOpened, setSearchReplaceOpened] = useState(false);
	const queryClient = useQueryClient();
	const { sidebarWidth, setSidebarWidth } = usePkbUiPrefs();
	const dragging = useRef(false);
	const dragStartX = useRef(0);
	const dragStartWidth = useRef(0);

	const vaultQuery = useQuery({
		queryKey: queryKeys.pkb.vault(vaultId),
		queryFn: () => pkbApi.vault(vaultId),
	});

	const treeQuery = useQuery({
		queryKey: queryKeys.pkb.fileTree(vaultId),
		queryFn: () => pkbApi.fileTree(vaultId),
	});

	const treeNodes = useMemo(() => {
		const root = treeQuery.data;
		if (!root) {
			return [];
		}
		return root.children ?? (root.type === 'folder' ? [] : [root]);
	}, [treeQuery.data]);

	const editorPath = selectedPath && isMarkdownFile(selectedPath) ? selectedPath : null;

	const handleNavigateNote = useCallback((path: string) => {
		setSelectedPath(path);
		setWorkspaceView('editor');
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			for (const folder of expandFoldersForPath(path)) {
				next.add(folder);
			}
			return next;
		});
	}, []);

	const dailyNoteMutation = useMutation({
		mutationFn: async () => {
			const path = resolveDailyNotePath(vaultQuery.data?.config);
			try {
				await pkbApi.fileContent(vaultId, path);
			} catch {
				const slash = path.lastIndexOf('/');
				if (slash > 0) {
					await pkbApi.createFolder(vaultId, path.slice(0, slash)).catch(() => undefined);
				}
				await pkbApi.putFileContent(vaultId, path, '');
			}
			return path;
		},
		onSuccess: async (path) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.fileTree(vaultId) });
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.notes(vaultId) });
			handleNavigateNote(path);
		},
	});

	const canWrite = vaultQuery.data?.permissions?.can_write ?? false;
	const templatesFolder = vaultQuery.data?.config?.templatesFolder ?? 'Templates';

	const handleToggleFolder = (path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	const handleResizePointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.preventDefault();
			dragging.current = true;
			dragStartX.current = event.clientX;
			dragStartWidth.current = sidebarWidth;
			event.currentTarget.setPointerCapture(event.pointerId);
		},
		[sidebarWidth],
	);

	const handleResizePointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (!dragging.current) {
				return;
			}
			const delta = event.clientX - dragStartX.current;
			setSidebarWidth(dragStartWidth.current + delta);
		},
		[setSidebarWidth],
	);

	const handleResizePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		dragging.current = false;
		event.currentTarget.releasePointerCapture(event.pointerId);
	}, []);

	return (
		<Stack gap={0} h="100%">
			<Group px="md" py="xs" justify="space-between" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
				<Group gap="sm" wrap="nowrap">
					<Button
						variant="subtle"
						size="compact-sm"
						leftSection={<IconArrowLeft size={16} />}
						onClick={onBack}
					>
						Назад
					</Button>
					<Text fw={600}>{vaultQuery.data?.name ?? 'Vault'}</Text>
				</Group>

				<VaultSearchBar vaultId={vaultId} onNavigateNote={handleNavigateNote} />

				<Group gap="sm" wrap="nowrap">
					<Button
						size="compact-xs"
						variant="light"
						leftSection={<IconCalendar size={14} />}
						onClick={() => dailyNoteMutation.mutate()}
						loading={dailyNoteMutation.isPending}
						disabled={!canWrite}
					>
						Сегодня
					</Button>
					{canWrite ? (
						<Button
							size="compact-xs"
							variant="light"
							leftSection={<IconFilePlus size={14} />}
							onClick={() => setTemplateOpened(true)}
						>
							Шаблон
						</Button>
					) : null}
					<Button
						size="compact-xs"
						variant="light"
						leftSection={<IconReplace size={14} />}
						onClick={() => setSearchReplaceOpened(true)}
					>
						Замена
					</Button>
					<IndexStaleIndicator
						vaultId={vaultId}
						canRebuildIndex={vaultQuery.data?.permissions?.can_rebuild_index ?? false}
					/>
					{vaultQuery.data?.permissions?.can_manage_members ? (
						<Button
							size="compact-xs"
							variant="light"
							leftSection={<IconUsers size={14} />}
							onClick={() => setShareOpened(true)}
						>
							Доступ
						</Button>
					) : null}
					<SegmentedControl
						size="xs"
						value={workspaceView}
						onChange={(value) => setWorkspaceView(value as WorkspaceView)}
						data={[
							{ label: 'Редактор', value: 'editor' },
							{ label: 'Граф', value: 'graph' },
						]}
					/>
				</Group>
			</Group>

			<Group align="stretch" gap={0} flex={1} style={{ minHeight: 0 }}>
				<Box
					w={sidebarWidth}
					style={{
						position: 'relative',
						borderRight: '1px solid var(--mantine-color-default-border)',
						minHeight: 0,
						flexShrink: 0,
					}}
				>
					<ScrollArea h="100%" p="xs">
						<BookmarksPanel vaultId={vaultId} onNavigateNote={handleNavigateNote} />
						{treeQuery.isLoading ? (
							<Group justify="center" py="md">
								<Loader size="sm" />
							</Group>
						) : treeQuery.isError ? (
							<Alert color="red" title="Ошибка">
								Не удалось загрузить дерево файлов
							</Alert>
						) : (
							<VaultFileTree
								nodes={treeNodes}
								selectedPath={selectedPath}
								onSelectFile={setSelectedPath}
								onToggleFolder={handleToggleFolder}
								expandedPaths={expandedPaths}
							/>
						)}
					</ScrollArea>
					<Box
						onPointerDown={handleResizePointerDown}
						onPointerMove={handleResizePointerMove}
						onPointerUp={handleResizePointerUp}
						onPointerCancel={handleResizePointerUp}
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							right: -3,
							width: 6,
							cursor: 'col-resize',
							zIndex: 5,
						}}
					/>
				</Box>

				<Box flex={1} style={{ minHeight: 0, minWidth: 0 }}>
					{workspaceView === 'graph' ? (
						<GraphView vaultId={vaultId} onNavigateNote={handleNavigateNote} />
					) : selectedPath && !editorPath ? (
						<Stack gap="xs" p="md">
							<Text size="sm" c="dimmed">
								{selectedPath}
							</Text>
							<Text c="dimmed">Редактор доступен только для файлов .md</Text>
						</Stack>
					) : (
						<NoteEditorPanel
							vaultId={vaultId}
							filePath={editorPath}
							canWrite={canWrite}
							onWikilinkNavigate={handleNavigateNote}
						/>
					)}
				</Box>

				<Box
					w={RIGHT_PANEL_WIDTH}
					style={{
						borderLeft: '1px solid var(--mantine-color-default-border)',
						minHeight: 0,
						flexShrink: 0,
					}}
				>
					<ScrollArea h="100%" type="auto" offsetScrollbars>
						<BacklinksPanel
							vaultId={vaultId}
							notePath={editorPath}
							onNavigateNote={handleNavigateNote}
						/>
					</ScrollArea>
				</Box>
			</Group>

			{vaultQuery.data?.permissions?.can_manage_members ? (
				<ShareVaultModal
					vaultId={vaultId}
					opened={shareOpened}
					canManageMembers
					onClose={() => setShareOpened(false)}
				/>
			) : null}

			<NewFromTemplateModal
				vaultId={vaultId}
				templatesFolder={templatesFolder}
				opened={templateOpened}
				onClose={() => setTemplateOpened(false)}
				onCreated={handleNavigateNote}
			/>

			<SearchReplaceModal
				vaultId={vaultId}
				opened={searchReplaceOpened}
				onClose={() => setSearchReplaceOpened(false)}
				canWrite={canWrite}
			/>
		</Stack>
	);
}
