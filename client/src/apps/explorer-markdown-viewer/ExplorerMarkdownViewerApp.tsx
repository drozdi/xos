import { Box, Button, Center, Group, Loader, ScrollArea, Stack, Text, Textarea } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


import { useAppContext } from '@/core/context/AppContext';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { saveExplorerText } from '@/features/explorer/explorerApi';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';


import { applyMarkdownFormat } from './markdownFormat';
import {
	MARKDOWN_SAVE_AS_CONSUMER,
	useMarkdownEditorStore,
} from './markdownEditorStore';
import classes from './markdownViewer.module.css';


const MARKDOWN_FILE_TYPES = ['markdown'];
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown'];

function markdownQueryKey(path: string) {
	return ['explorer', 'markdown', path] as const;
}


export default function ExplorerMarkdownViewerApp() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApi();
	const queryClient = useQueryClient();
	const saveAsConsumerId = `${MARKDOWN_SAVE_AS_CONSUMER}:${windowId}`;
	const { currentPath, setCurrentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-markdown-viewer',
		fileTypes: MARKDOWN_FILE_TYPES,
		extensions: MARKDOWN_EXTENSIONS,
	});


	const session = useMarkdownEditorStore((state) => state.getSession(windowId));
	const ensureSession = useMarkdownEditorStore((state) => state.ensureSession);
	const setPath = useMarkdownEditorStore((state) => state.setPath);
	const setContent = useMarkdownEditorStore((state) => state.setContent);
	const markLoaded = useMarkdownEditorStore((state) => state.markLoaded);
	const patchSession = useMarkdownEditorStore((state) => state.patchSession);


	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const remarkPlugins = useMemo(() => [remarkGfm], []);

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


	useEffect(() => {
		if (!currentPath || !contentQuery.isSuccess || contentQuery.data === undefined) {
			return;
		}
		const existing = useMarkdownEditorStore.getState().getSession(windowId);
		// Keep unsaved edits; when clean, re-apply if query data differs (save + reopen).
		if (existing.dirty) {
			return;
		}
		if (existing.loadedPath === currentPath && existing.content === contentQuery.data) {
			return;
		}
		markLoaded(windowId, currentPath, contentQuery.data);
	}, [
		contentQuery.data,
		contentQuery.isSuccess,
		currentPath,
		markLoaded,
		windowId,
	]);


	const openSaveAsPicker = useCallback(async () => {
		const latest = useMarkdownEditorStore.getState().getSession(windowId);
		const defaultName = latest.path
			? getExplorerFileName(latest.path)
			: 'untitled.md';
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
		const latest = useMarkdownEditorStore.getState().getSession(windowId);
		if (!latest.path) {
			patchSession(windowId, { closeAfterSaveAs: false });
			await openSaveAsPicker();
			return;
		}
		try {
			await saveExplorerText(latest.path, latest.content);
			syncMarkdownQueryCache(latest.path, latest.content);
			patchSession(windowId, { dirty: false });
			notifications.show({
				color: 'green',
				message: 'Файл сохранён',
			});
		} catch {
			notifications.show({
				color: 'red',
				message: 'Не удалось сохранить файл',
			});
		}
	}, [openSaveAsPicker, patchSession, syncMarkdownQueryCache, windowId]);


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
							variant="default"
							onClick={() => {
								modals.close(modalId);
							}}
						>
							Отмена
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
										syncMarkdownQueryCache(latest.path, latest.content);
										notifications.show({
											color: 'green',
											message: 'Файл сохранён',
										});
										forceCloseWindow();
									} catch {
										notifications.show({
											color: 'red',
											message: 'Не удалось сохранить файл',
										});
									}
								})();
							}}
						>
							Сохранить
						</Button>
					</Group>
				</Stack>
			),
		});
	}, [forceCloseWindow, openSaveAsPicker, syncMarkdownQueryCache, windowId]);


	useExplorerPickerResult(saveAsConsumerId, (path) => {
		void (async () => {
			const latest = useMarkdownEditorStore.getState().getSession(windowId);
			try {
				await saveExplorerText(path, latest.content);
				syncMarkdownQueryCache(path, latest.content);
				const shouldClose = latest.closeAfterSaveAs;
				if (shouldClose) {
					notifications.show({
						color: 'green',
						message: 'Файл сохранён',
					});
					forceCloseWindow();
					return;
				}
				setCurrentPath(path);
				markLoaded(windowId, path, latest.content);
				notifications.show({
					color: 'green',
					message: 'Файл сохранён',
				});
			} catch {
				useMarkdownEditorStore.getState().patchSession(windowId, {
					closeAfterSaveAs: false,
				});
				notifications.show({
					color: 'red',
					message: 'Не удалось сохранить файл',
				});
			}
		})();
	});


	useEffect(() => {
		return coreApi.window.on('close', () => {
			const latest = useMarkdownEditorStore.getState().getSession(windowId);
			if (!latest.dirty) {
				useMarkdownEditorStore.getState().clearSession(windowId);
				return;
			}
			promptCloseWithSave();
			return false;
		});
	}, [coreApi, promptCloseWithSave, windowId]);


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
		if (session.formatNonce === 0 || !session.formatCommand) {
			return;
		}
		const el = textareaRef.current;
		const command = session.formatCommand;
		const start = el?.selectionStart ?? session.content.length;
		const end = el?.selectionEnd ?? session.content.length;
		const next = applyMarkdownFormat(session.content, start, end, command);
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
		setContent,
		windowId,
	]);


	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return;
			}
			const key = event.key.toLowerCase();
			if (key === 's') {
				event.preventDefault();
				void save();
			}
			if (key === 'o') {
				event.preventDefault();
				void openFile();
			}
			if (key === 'b') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(windowId, 'bold');
			}
			if (key === 'i') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(windowId, 'italic');
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [openFile, save, windowId]);


	const showEditor = session.viewMode === 'edit' || session.viewMode === 'split';
	const showPreview = session.viewMode === 'preview' || session.viewMode === 'split';
	const isLoadingFile =
		Boolean(currentPath) &&
		contentQuery.isLoading &&
		session.loadedPath !== currentPath;
	const isLoadError =
		Boolean(currentPath) &&
		contentQuery.isError &&
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
						display: 'grid',
						gridTemplateColumns:
							showEditor && showPreview ? '1fr 1fr' : '1fr',
						overflow: 'hidden',
					}}
				>
					{showEditor ? (
						<Textarea
							ref={textareaRef}
							value={session.content}
							onChange={(event) => setContent(windowId, event.currentTarget.value)}
							autosize={false}
							placeholder="Файл → Открыть… или начните писать"
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
									borderRight:
										showPreview
											? '1px solid var(--mantine-color-default-border)'
											: undefined,
								},
							}}
						/>
					) : null}
					{showPreview ? (
						<ScrollArea style={{ minHeight: 0, height: '100%' }} type="auto" offsetScrollbars>
							<Box className={classes.markdownViewer} p="md" maw={900} mx="auto" pb="xl">
								{session.content.trim() ? (
									<ReactMarkdown remarkPlugins={remarkPlugins}>
										{session.content}
									</ReactMarkdown>
								) : (
									<Text c="dimmed">Нет содержимого для просмотра</Text>
								)}
							</Box>
						</ScrollArea>
					) : null}
				</Box>
			)}
		</Box>
	);
}
