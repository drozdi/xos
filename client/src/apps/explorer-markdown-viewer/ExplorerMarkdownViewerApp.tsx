import { Box, Button, Center, Group, Loader, ScrollArea, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useWmStore } from '@/core/windowManager/useWmStore';
import { saveExplorerText } from '@/features/explorer/explorerApi';
import { canWriteExplorerEntry, fetchExplorerInfo } from '@/features/explorer/explorerApi';
import { invalidateExplorerFolder } from '@/features/explorer/explorerQueryUtils';
import { useCanWriteExplorer } from '@/features/explorer/explorerAccess';
import { getExplorerFileName, getExplorerFolderPath } from '@/features/explorer/explorerPathUtils';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

import { applyMarkdownFormat } from './markdownFormat';
import {
	MARKDOWN_SAVE_AS_CONSUMER,
	EMPTY_MARKDOWN_SESSION,
	useMarkdownEditorStore,
} from './markdownEditorStore';
import { MarkdownPreview } from './MarkdownPreview';
import { MarkdownWysiwygEditor } from './MarkdownWysiwygEditor';
import {
	defaultMarkdownViewMode,
	MARKDOWN_VIEW_MODE_LABELS,
	normalizeMarkdownViewMode,
	showsMarkdownPreview,
	showsMarkdownSource,
	showsMarkdownWysiwyg,
	type MarkdownViewMode,
} from './markdownViewMode';

const MARKDOWN_FILE_TYPES = ['markdown'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown'];
const MAX_SOURCE_UNDO_STACK = 200;

function isTiptapTarget(target: EventTarget | null): boolean {
	return target instanceof Element && Boolean(target.closest('.tiptap'));
}

function markdownQueryKey(path: string) {
	return ['explorer', 'markdown', path] as const;
}

function explorerInfoQueryKey(path: string) {
	return ['explorer', 'info', path] as const;
}

export default function ExplorerMarkdownViewerApp() {
	const { windowId } = useAppContext();
	const activeWindowId = useWmStore((state) => state.activeWindowId);
	const isActive = activeWindowId === windowId;
	const coreApi = useCoreApi();
	const queryClient = useQueryClient();
	const canWriteExplorer = useCanWriteExplorer();
	const saveAsConsumerId = `${MARKDOWN_SAVE_AS_CONSUMER}:${windowId}`;
	const { currentPath, setCurrentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-markdown-viewer',
		fileTypes: MARKDOWN_FILE_TYPES,
		extensions: MARKDOWN_EXTENSIONS,
	});

	const session = useMarkdownEditorStore((state) => state.sessions[windowId]) ?? EMPTY_MARKDOWN_SESSION;
	const ensureSession = useMarkdownEditorStore((state) => state.ensureSession);
	const setPath = useMarkdownEditorStore((state) => state.setPath);
	const setContent = useMarkdownEditorStore((state) => state.setContent);
	const markLoaded = useMarkdownEditorStore((state) => state.markLoaded);
	const patchSession = useMarkdownEditorStore((state) => state.patchSession);
	const setViewMode = useMarkdownEditorStore((state) => state.setViewMode);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const undoStackRef = useRef<string[]>([]);
	const redoStackRef = useRef<string[]>([]);
	const skipSourceHistoryRef = useRef(false);

	const resetSourceHistory = useCallback(() => {
		undoStackRef.current = [];
		redoStackRef.current = [];
	}, []);

	const pushSourceHistory = useCallback((snapshot: string) => {
		undoStackRef.current.push(snapshot);
		if (undoStackRef.current.length > MAX_SOURCE_UNDO_STACK) {
			undoStackRef.current.shift();
		}
		redoStackRef.current = [];
	}, []);

	const syncMarkdownQueryCache = useCallback(
		(path: string, content: string) => {
			queryClient.setQueryData(markdownQueryKey(path), content);
		},
		[queryClient],
	);

	useEffect(() => {
		ensureSession(windowId);
	}, [ensureSession, windowId]);

	useEffect(() => {
		setPath(windowId, currentPath);
	}, [currentPath, setPath, windowId]);

	const fileName = currentPath ? getExplorerFileName(currentPath) : 'Markdown';
	useWindowTitle(session.dirty ? `${fileName} *` : fileName);

	const contentQuery = useQuery({
		queryKey: markdownQueryKey(currentPath ?? ''),
		queryFn: () => fetchExplorerText(currentPath!),
		enabled: Boolean(currentPath),
	});

	const fileInfoQuery = useQuery({
		queryKey: explorerInfoQueryKey(currentPath ?? ''),
		queryFn: () => fetchExplorerInfo(currentPath!),
		enabled: Boolean(currentPath),
	});

	const writable = useMemo(() => {
		if (!canWriteExplorer) {
			return false;
		}
		if (!currentPath) {
			return true;
		}
		if (!fileInfoQuery.isSuccess) {
			return true;
		}
		return canWriteExplorerEntry(fileInfoQuery.data.permissions);
	}, [canWriteExplorer, currentPath, fileInfoQuery.data?.permissions, fileInfoQuery.isSuccess]);

	useEffect(() => {
		if (!currentPath || !contentQuery.isSuccess || contentQuery.data === undefined) {
			return;
		}
		const existing = useMarkdownEditorStore.getState().getSession(windowId);
		if (existing.dirty) {
			return;
		}
		if (existing.loadedPath === currentPath && existing.content === contentQuery.data) {
			return;
		}
		markLoaded(windowId, currentPath, contentQuery.data);
	}, [contentQuery.data, contentQuery.isSuccess, currentPath, markLoaded, windowId]);

	useEffect(() => {
		const nextReadOnly = !writable;
		const current = useMarkdownEditorStore.getState().sessions[windowId]?.readOnly;
		if (current !== nextReadOnly) {
			patchSession(windowId, { readOnly: nextReadOnly });
		}
	}, [patchSession, windowId, writable]);

	useEffect(() => {
		if (writable) {
			return;
		}
		const mode = normalizeMarkdownViewMode(
			useMarkdownEditorStore.getState().sessions[windowId]?.viewMode,
		);
		if (mode === 'live') {
			setViewMode(windowId, defaultMarkdownViewMode(false));
		}
	}, [setViewMode, windowId, writable]);

	const openSaveAsPicker = useCallback(async () => {
		const latest = useMarkdownEditorStore.getState().getSession(windowId);
		const defaultName = latest.path ? getExplorerFileName(latest.path) : 'untitled.md';
		await openExplorerPicker({
			mode: 'save',
			consumerAppId: saveAsConsumerId,
			fileTypes: MARKDOWN_FILE_TYPES,
			extensions: MARKDOWN_EXTENSIONS,
			initialPath: latest.path ?? undefined,
			defaultFileName: defaultName.endsWith('.md') ? defaultName : `${defaultName}.md`,
			title: 'Сохранить Markdown как…',
		});
	}, [saveAsConsumerId, windowId]);

	const save = useCallback(async () => {
		if (!writable) {
			return;
		}
		const latest = useMarkdownEditorStore.getState().getSession(windowId);
		if (!latest.path) {
			patchSession(windowId, { closeAfterSaveAs: false });
			await openSaveAsPicker();
			return;
		}
		try {
			await saveExplorerText(latest.path, latest.content);
			await invalidateExplorerFolder(queryClient, getExplorerFolderPath(latest.path));
			syncMarkdownQueryCache(latest.path, latest.content);
			patchSession(windowId, { dirty: false });
			notifications.show({ color: 'green', message: 'Файл сохранён' });
		} catch {
			notifications.show({ color: 'red', message: 'Не удалось сохранить файл' });
		}
	}, [openSaveAsPicker, patchSession, queryClient, syncMarkdownQueryCache, windowId, writable]);

	const forceCloseWindow = useCallback(() => {
		useMarkdownEditorStore.getState().clearSession(windowId);
		void coreApi.window.close(true);
	}, [coreApi, windowId]);

	const promptCloseWithSave = useCallback(() => {
		const modalId = modals.open({
			title: 'Сохранить изменения?',
			centered: true,
			children: (
				<Stack gap="md">
					<Text size="sm">В файле есть несохранённые изменения.</Text>
					<Group justify="flex-end" gap="xs">
						<Button
							onClick={() => {
								modals.close(modalId);
								void (async () => {
									const latest = useMarkdownEditorStore.getState().getSession(windowId);
									if (!latest.path) {
										useMarkdownEditorStore.getState().patchSession(windowId, {
											closeAfterSaveAs: true,
										});
										await openSaveAsPicker();
										return;
									}
									try {
										await saveExplorerText(latest.path, latest.content);
										await invalidateExplorerFolder(
											queryClient,
											getExplorerFolderPath(latest.path),
										);
										syncMarkdownQueryCache(latest.path, latest.content);
										notifications.show({ color: 'green', message: 'Файл сохранён' });
										forceCloseWindow();
									} catch {
										notifications.show({ color: 'red', message: 'Не удалось сохранить файл' });
									}
								})();
							}}
						>
							Сохранить
						</Button>
						<Button
							variant="default"
							onClick={() => {
								modals.close(modalId);
								useMarkdownEditorStore.getState().patchSession(windowId, {
									closeAfterSaveAs: true,
								});
								void openSaveAsPicker();
							}}
						>
							Сохранить как…
						</Button>
						<Button
							variant="default"
							onClick={() => {
								modals.close(modalId);
								forceCloseWindow();
							}}
						>
							Не сохранять
						</Button>
					</Group>
				</Stack>
			),
		});
	}, [forceCloseWindow, openSaveAsPicker, queryClient, syncMarkdownQueryCache, windowId]);

	useExplorerPickerResult(saveAsConsumerId, (path) => {
		void (async () => {
			const latest = useMarkdownEditorStore.getState().getSession(windowId);
			try {
				await saveExplorerText(path, latest.content);
				await invalidateExplorerFolder(queryClient, getExplorerFolderPath(path));
				syncMarkdownQueryCache(path, latest.content);
				const shouldClose = latest.closeAfterSaveAs;
				if (shouldClose) {
					notifications.show({ color: 'green', message: 'Файл сохранён' });
					forceCloseWindow();
					return;
				}
				setCurrentPath(path);
				markLoaded(windowId, path, latest.content);
				notifications.show({ color: 'green', message: 'Файл сохранён' });
			} catch {
				useMarkdownEditorStore.getState().patchSession(windowId, { closeAfterSaveAs: false });
				notifications.show({ color: 'red', message: 'Не удалось сохранить файл' });
			}
		})();
	});

	useEffect(() => {
		return coreApi.window.on('close', () => {
			const latest = useMarkdownEditorStore.getState().getSession(windowId);
			if (!latest.dirty || !writable) {
				useMarkdownEditorStore.getState().clearSession(windowId);
				return;
			}
			promptCloseWithSave();
			return false;
		});
	}, [coreApi, promptCloseWithSave, windowId, writable]);

	useEffect(() => {
		if (session.saveNonce === 0) {
			return;
		}
		void save();
	}, [save, session.saveNonce]);

	useEffect(() => {
		if (session.saveAsNonce === 0) {
			return;
		}
		patchSession(windowId, { closeAfterSaveAs: false });
		void openSaveAsPicker();
	}, [openSaveAsPicker, patchSession, session.saveAsNonce, windowId]);

	useEffect(() => {
		if (!writable || session.formatNonce === 0 || !session.formatCommand) {
			return;
		}
		if (normalizeMarkdownViewMode(session.viewMode) !== 'source') {
			return;
		}
		const el = textareaRef.current;
		const command = session.formatCommand;
		const start = el?.selectionStart ?? session.content.length;
		const end = el?.selectionEnd ?? session.content.length;
		const next = applyMarkdownFormat(session.content, start, end, command);
		pushSourceHistory(session.content);
		setContent(windowId, next.value);
		requestAnimationFrame(() => {
			const area = textareaRef.current;
			if (!area) {
				return;
			}
			area.focus();
			area.setSelectionRange(next.selectionStart, next.selectionEnd);
		});
		patchSession(windowId, { formatCommand: null });
	}, [
		patchSession,
		session.content,
		session.formatCommand,
		session.formatNonce,
		session.viewMode,
		setContent,
		pushSourceHistory,
		windowId,
		writable,
	]);

	useEffect(() => {
		if (session.undoNonce === 0 || !writable) {
			return;
		}
		if (normalizeMarkdownViewMode(session.viewMode) !== 'source') {
			return;
		}
		const previous = undoStackRef.current.pop();
		if (previous === undefined) {
			return;
		}
		redoStackRef.current.push(session.content);
		skipSourceHistoryRef.current = true;
		setContent(windowId, previous);
		skipSourceHistoryRef.current = false;
	}, [session.undoNonce, session.viewMode, session.content, setContent, windowId, writable]);

	useEffect(() => {
		if (session.redoNonce === 0 || !writable) {
			return;
		}
		if (normalizeMarkdownViewMode(session.viewMode) !== 'source') {
			return;
		}
		const next = redoStackRef.current.pop();
		if (next === undefined) {
			return;
		}
		undoStackRef.current.push(session.content);
		if (undoStackRef.current.length > MAX_SOURCE_UNDO_STACK) {
			undoStackRef.current.shift();
		}
		skipSourceHistoryRef.current = true;
		setContent(windowId, next);
		skipSourceHistoryRef.current = false;
	}, [session.redoNonce, session.viewMode, session.content, setContent, windowId, writable]);

	useEffect(() => {
		resetSourceHistory();
	}, [resetSourceHistory, session.loadedPath, session.viewMode]);

	useEffect(() => {
		if (!isActive) {
			return undefined;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return;
			}
			const key = event.key.toLowerCase();
			const viewMode = normalizeMarkdownViewMode(
				useMarkdownEditorStore.getState().sessions[windowId]?.viewMode,
			);
			const canEdit = writable && viewMode !== 'reading';

			if (key === 's') {
				event.preventDefault();
				if (writable) {
					void save();
				}
				return;
			}
			if (key === 'o') {
				event.preventDefault();
				void openFile();
				return;
			}
			if (!canEdit) {
				return;
			}
			if (key === 'z' && !event.shiftKey) {
				if (viewMode === 'live' && isTiptapTarget(event.target)) {
					return;
				}
				event.preventDefault();
				useMarkdownEditorStore.getState().requestUndo(windowId);
				return;
			}
			if ((key === 'z' && event.shiftKey) || key === 'y') {
				if (viewMode === 'live' && isTiptapTarget(event.target)) {
					return;
				}
				event.preventDefault();
				useMarkdownEditorStore.getState().requestRedo(windowId);
				return;
			}
			if (key === 'b') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(windowId, 'bold');
				return;
			}
			if (key === 'i') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(windowId, 'italic');
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [isActive, openFile, save, windowId, writable]);

	const viewMode = normalizeMarkdownViewMode(session.viewMode);
	const showWysiwyg = showsMarkdownWysiwyg(viewMode);
	const showSource = showsMarkdownSource(viewMode);
	const showPreview = showsMarkdownPreview(viewMode);

	const handleFormatHandled = useCallback(() => {
		patchSession(windowId, { formatCommand: null });
	}, [patchSession, windowId]);

	const modeOptions = useMemo(
		() =>
			(['live', 'source', 'reading'] as MarkdownViewMode[]).map((mode) => ({
				value: mode,
				label: MARKDOWN_VIEW_MODE_LABELS[mode],
				disabled: !writable && mode === 'live',
			})),
		[writable],
	);

	const isLoadingFile =
		Boolean(currentPath) &&
		(contentQuery.isLoading || fileInfoQuery.isLoading) &&
		session.loadedPath !== currentPath;
	const isLoadError =
		Boolean(currentPath) &&
		(contentQuery.isError || fileInfoQuery.isError) &&
		session.loadedPath !== currentPath;

	return (
		<Box
			h="100%"
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<Group
				px="md"
				py="xs"
				gap="sm"
				wrap="nowrap"
				style={{
					flexShrink: 0,
					borderBottom: '1px solid var(--mantine-color-default-border)',
				}}
			>
				<SegmentedControl
					size="xs"
					value={viewMode}
					onChange={(value) => setViewMode(windowId, value as MarkdownViewMode)}
					data={modeOptions}
				/>
				{!writable ? (
					<Text size="xs" c="dimmed">
						Только чтение
					</Text>
				) : null}
			</Group>

			{isLoadingFile ? (
				<Center style={{ flex: 1 }} p="md">
					<Loader size="sm" />
				</Center>
			) : isLoadError ? (
				<Center style={{ flex: 1 }} p="md">
					<Text c="red">Не удалось загрузить файл</Text>
				</Center>
			) : (
				<Box
					style={{
						flex: 1,
						minHeight: 0,
						overflow: 'hidden',
					}}
				>
					{showWysiwyg ? (
						<MarkdownWysiwygEditor
							content={session.content}
							onChange={(value) => setContent(windowId, value)}
							formatNonce={session.formatNonce}
							formatCommand={session.formatCommand}
							undoNonce={session.undoNonce}
							redoNonce={session.redoNonce}
							onFormatHandled={handleFormatHandled}
						/>
					) : null}
					{showSource ? (
						<Textarea
							ref={textareaRef}
							value={session.content}
							readOnly={!writable}
							onChange={(event) => {
								if (!writable) {
									return;
								}
								const next = event.currentTarget.value;
								if (!skipSourceHistoryRef.current && next !== session.content) {
									pushSourceHistory(session.content);
								}
								setContent(windowId, next);
							}}
							autosize={false}
							placeholder={
								writable
									? 'Файл → Открыть… или начните писать'
									: 'Исходный код (только просмотр)'
							}
							styles={{
								root: {
									height: '100%',
									minHeight: 0,
									display: 'flex',
									flexDirection: 'column',
								},
								wrapper: { flex: 1, minHeight: 0, display: 'flex' },
								input: {
									flex: 1,
									height: '100%',
									minHeight: 0,
									padding: 'var(--mantine-spacing-md)',
									fontFamily: 'var(--mantine-font-family-monospace)',
									fontSize: 'var(--mantine-font-size-sm)',
									lineHeight: 1.55,
									border: 'none',
									borderRadius: 0,
									cursor: writable ? 'text' : 'default',
								},
							}}
						/>
					) : null}
					{showPreview ? (
						<ScrollArea style={{ minHeight: 0, height: '100%' }} type="auto" offsetScrollbars>
							<MarkdownPreview content={session.content} variant="reading" />
						</ScrollArea>
					) : null}
				</Box>
			)}
		</Box>
	);
}
