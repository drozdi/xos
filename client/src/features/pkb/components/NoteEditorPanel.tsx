import {
	ActionIcon,
	Box,
	Button,
	Center,
	FileButton,
	Group,
	Loader,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	Textarea,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconBookmarkFilled, IconDeviceFloppy, IconPaperclip } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	applyMarkdownFormat,
	EMPTY_MARKDOWN_SESSION,
	MARKDOWN_VIEW_MODE_LABELS,
	MarkdownPreview,
	MarkdownWysiwygEditor,
	normalizeMarkdownViewMode,
	showsMarkdownPreview,
	showsMarkdownSource,
	showsMarkdownWysiwyg,
	useMarkdownEditorStore,
	type MarkdownViewMode,
} from '@/features/markdown';
import { WikilinkAutocompleteMenu } from '@/features/pkb/editor/WikilinkAutocompleteMenu';
import { useWikilinkNavigate } from '@/features/pkb/editor/useWikilinkNavigate';
import {
	createWikilinkExtension,
	type WikilinkAutocompleteState,
	type WikilinkSuggestion,
} from '@/features/pkb/editor/wikilinkExtension';
import { normalizeWikilinkTitle } from '@/features/pkb/editor/wikilinkHelpers';
import '@/features/pkb/editor/pkbEditor.module.css';

const MAX_SOURCE_UNDO_STACK = 200;

interface NoteEditorPanelProps {
	vaultId: number;
	filePath: string | null;
	canWrite?: boolean;
	onWikilinkNavigate?: (path: string) => void;
}

function pkbSessionKey(vaultId: number): string {
	return `pkb:${vaultId}`;
}

function isTiptapTarget(target: EventTarget | null): boolean {
	return target instanceof Element && Boolean(target.closest('.tiptap'));
}

function pkbContentQueryKey(vaultId: number, path: string) {
	return ['pkb', 'fileContent', vaultId, path] as const;
}

function resolveAttachmentFolder(notePath: string, attachmentFolder: string): string {
	const folder = attachmentFolder.replace(/^\/+|\/+$/g, '') || 'attachments';
	const slash = notePath.lastIndexOf('/');
	const noteDir = slash >= 0 ? notePath.slice(0, slash) : '';
	return noteDir ? `${noteDir}/${folder}` : folder;
}

function relativePathFromNote(notePath: string, uploadedPath: string): string {
	const slash = notePath.lastIndexOf('/');
	const noteDir = slash >= 0 ? notePath.slice(0, slash) : '';
	if (!noteDir) {
		return uploadedPath;
	}
	const prefix = `${noteDir}/`;
	if (uploadedPath.startsWith(prefix)) {
		return uploadedPath.slice(prefix.length);
	}
	return uploadedPath;
}

function insertMarkdownSnippet(
	content: string,
	snippet: string,
	selectionStart: number,
	selectionEnd: number,
): { value: string; selectionStart: number; selectionEnd: number } {
	const before = content.slice(0, selectionStart);
	const after = content.slice(selectionEnd);
	const needsLeadingNewline = before.length > 0 && !before.endsWith('\n');
	const needsTrailingNewline = after.length > 0 && !after.startsWith('\n');
	const block = `${needsLeadingNewline ? '\n' : ''}${snippet}${needsTrailingNewline ? '\n' : ''}`;
	const next = `${before}${block}${after}`;
	const cursor = before.length + block.length;
	return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

export function NoteEditorPanel({ vaultId, filePath, canWrite = false, onWikilinkNavigate }: NoteEditorPanelProps) {
	const sessionKey = pkbSessionKey(vaultId);
	const queryClient = useQueryClient();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const undoStackRef = useRef<string[]>([]);
	const redoStackRef = useRef<string[]>([]);
	const skipSourceHistoryRef = useRef(false);
	const [wikilinkAutocomplete, setWikilinkAutocomplete] = useState<WikilinkAutocompleteState | null>(
		null,
	);
	const editorRef = useRef<Editor | null>(null);

	const handleNavigate = useCallback(
		(path: string) => {
			onWikilinkNavigate?.(path);
		},
		[onWikilinkNavigate],
	);

	const handleWikilinkClick = useWikilinkNavigate(vaultId, handleNavigate);

	const notesQuery = useQuery({
		queryKey: queryKeys.pkb.notes(vaultId),
		queryFn: () => pkbApi.notes(vaultId),
	});

	const noteTitleSet = useMemo(() => {
		const titles = new Set<string>();
		for (const note of notesQuery.data?.notes ?? []) {
			titles.add(normalizeWikilinkTitle(note.title).toLowerCase());
		}
		return titles;
	}, [notesQuery.data?.notes]);

	const noteSuggestionsRef = useRef<WikilinkSuggestion[]>([]);
	const handleWikilinkClickRef = useRef<(title: string) => void>(() => undefined);
	const isBrokenWikilinkRef = useRef<(title: string) => boolean>(() => false);

	const noteSuggestions = useMemo<WikilinkSuggestion[]>(
		() =>
			(notesQuery.data?.notes ?? []).map((note) => ({
				title: note.title,
				path: note.path,
			})),
		[notesQuery.data?.notes],
	);

	noteSuggestionsRef.current = noteSuggestions;

	const isBrokenWikilink = useCallback(
		(title: string) => !noteTitleSet.has(normalizeWikilinkTitle(title).toLowerCase()),
		[noteTitleSet],
	);

	isBrokenWikilinkRef.current = isBrokenWikilink;
	handleWikilinkClickRef.current = (title: string) => {
		void handleWikilinkClick(title);
	};

	const wikilinkExtension = useMemo(
		() =>
			createWikilinkExtension({
				getSuggestions: (query) => {
					const normalizedQuery = normalizeWikilinkTitle(query).toLowerCase();
					const suggestions = noteSuggestionsRef.current;
					if (!normalizedQuery) {
						return suggestions.slice(0, 12);
					}
					return suggestions
						.filter((note) => note.title.toLowerCase().includes(normalizedQuery))
						.slice(0, 12);
				},
				onAutocompleteStateChange: setWikilinkAutocomplete,
				onWikilinkClick: (title) => {
					handleWikilinkClickRef.current(title);
				},
				isBrokenLink: (title) => isBrokenWikilinkRef.current(title),
			}),
		[],
	);

	const editorExtensions = useMemo(() => [wikilinkExtension], [wikilinkExtension]);

	const handleEditorReady = useCallback((editor: Editor) => {
		editorRef.current = editor;
	}, []);

	const handleAutocompleteSelect = useCallback(
		(suggestion: WikilinkSuggestion) => {
			const range = wikilinkAutocomplete;
			setWikilinkAutocomplete(null);
			const editor = editorRef.current;
			if (!editor || editor.isDestroyed || !range) {
				return;
			}
			editor
				.chain()
				.focus()
				.deleteRange({ from: range.from, to: range.to })
				.insertContent({
					type: 'wikilink',
					attrs: {
						title: suggestion.title,
						alias: null,
						heading: null,
					},
				})
				.run();
		},
		[wikilinkAutocomplete],
	);

	const session = useMarkdownEditorStore((state) => state.sessions[sessionKey]) ?? EMPTY_MARKDOWN_SESSION;
	const ensureSession = useMarkdownEditorStore((state) => state.ensureSession);
	const setPath = useMarkdownEditorStore((state) => state.setPath);
	const setContent = useMarkdownEditorStore((state) => state.setContent);
	const markLoaded = useMarkdownEditorStore((state) => state.markLoaded);
	const patchSession = useMarkdownEditorStore((state) => state.patchSession);
	const setViewMode = useMarkdownEditorStore((state) => state.setViewMode);

	const vaultQuery = useQuery({
		queryKey: queryKeys.pkb.vault(vaultId),
		queryFn: () => pkbApi.vault(vaultId),
	});

	const bookmarksQuery = useQuery({
		queryKey: queryKeys.pkb.bookmarks(vaultId),
		queryFn: () => pkbApi.bookmarks(vaultId),
	});

	const isBookmarked = useMemo(() => {
		if (!filePath) {
			return false;
		}
		return (bookmarksQuery.data?.items ?? []).some((item) => item.path === filePath);
	}, [bookmarksQuery.data?.items, filePath]);

	const bookmarkTitle = useMemo(() => {
		if (!filePath) {
			return '';
		}
		const note = notesQuery.data?.notes.find((n) => n.path === filePath);
		return note?.title ?? filePath.split('/').pop()?.replace(/\.md$/i, '') ?? filePath;
	}, [filePath, notesQuery.data?.notes]);

	const bookmarkMutation = useMutation({
		mutationFn: async (add: boolean) => {
			const current = bookmarksQuery.data?.items ?? [];
			const items = add
				? [
						...current.filter((item) => item.path !== filePath),
						{
							path: filePath!,
							title: bookmarkTitle,
							addedAt: new Date().toISOString(),
						},
					]
				: current.filter((item) => item.path !== filePath);
			return pkbApi.putBookmarks(vaultId, items);
		},
		onSuccess: (data) => {
			queryClient.setQueryData(queryKeys.pkb.bookmarks(vaultId), data);
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось обновить закладки' });
		},
	});

	const contentQuery = useQuery({
		queryKey: pkbContentQueryKey(vaultId, filePath ?? ''),
		queryFn: () => pkbApi.fileContent(vaultId, filePath!),
		enabled: Boolean(filePath),
	});

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

	useEffect(() => {
		ensureSession(sessionKey);
	}, [ensureSession, sessionKey]);

	useEffect(() => {
		setPath(sessionKey, filePath);
	}, [filePath, sessionKey, setPath]);

	useEffect(() => {
		if (!filePath || !contentQuery.isSuccess || contentQuery.data === undefined) {
			return;
		}
		const existing = useMarkdownEditorStore.getState().getSession(sessionKey);
		if (existing.dirty) {
			return;
		}
		if (existing.loadedPath === filePath && existing.content === contentQuery.data.content) {
			return;
		}
		markLoaded(sessionKey, filePath, contentQuery.data.content);
	}, [contentQuery.data, contentQuery.isSuccess, filePath, markLoaded, sessionKey]);

	const saveMutation = useMutation({
		mutationFn: ({ path, content }: { path: string; content: string }) =>
			pkbApi.putFileContent(vaultId, path, content),
		onSuccess: async (_data, variables) => {
			queryClient.setQueryData(pkbContentQueryKey(vaultId, variables.path), {
				path: variables.path,
				content: variables.content,
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queryKeys.pkb.notes(vaultId) }),
				queryClient.invalidateQueries({
					queryKey: queryKeys.pkb.backlinks(vaultId, variables.path),
				}),
				queryClient.invalidateQueries({ queryKey: ['pkb', 'backlinks', vaultId] }),
			]);
			patchSession(sessionKey, { dirty: false });
			notifications.show({ color: 'green', message: 'Файл сохранён' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось сохранить файл' });
		},
	});

	const uploadMutation = useMutation({
		mutationFn: ({ folderPath, file }: { folderPath: string; file: File }) =>
			pkbApi.uploadFile(vaultId, folderPath, file),
		onSuccess: async (entry) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.fileTree(vaultId) });
			if (!filePath) {
				return;
			}
			const relative = relativePathFromNote(filePath, entry.path);
			const snippet = `![${entry.name}](${relative})`;
			const viewMode = normalizeMarkdownViewMode(
				useMarkdownEditorStore.getState().getSession(sessionKey).viewMode,
			);
			const latest = useMarkdownEditorStore.getState().getSession(sessionKey);

			if (viewMode === 'source') {
				const el = textareaRef.current;
				const start = el?.selectionStart ?? latest.content.length;
				const end = el?.selectionEnd ?? latest.content.length;
				const next = insertMarkdownSnippet(latest.content, snippet, start, end);
				pushSourceHistory(latest.content);
				setContent(sessionKey, next.value);
				requestAnimationFrame(() => {
					const area = textareaRef.current;
					if (!area) {
						return;
					}
					area.focus();
					area.setSelectionRange(next.selectionStart, next.selectionEnd);
				});
			} else {
				const sep =
					latest.content.length > 0 && !latest.content.endsWith('\n')
						? '\n\n'
						: latest.content.length > 0
							? '\n'
							: '';
				setContent(sessionKey, `${latest.content}${sep}${snippet}`);
			}
			notifications.show({ color: 'green', message: 'Файл загружен' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось загрузить файл' });
		},
	});

	const save = useCallback(() => {
		if (!filePath || saveMutation.isPending) {
			return;
		}
		const latest = useMarkdownEditorStore.getState().getSession(sessionKey);
		if (!latest.dirty) {
			return;
		}
		saveMutation.mutate({ path: filePath, content: latest.content });
	}, [filePath, saveMutation, sessionKey]);

	const handleUpload = useCallback(
		(file: File | null) => {
			if (!file || !filePath || uploadMutation.isPending) {
				return;
			}
			const attachmentFolder = vaultQuery.data?.config?.attachmentFolder ?? 'attachments';
			const folderPath = resolveAttachmentFolder(filePath, attachmentFolder);
			uploadMutation.mutate({ folderPath, file });
		},
		[filePath, uploadMutation, vaultQuery.data?.config?.attachmentFolder],
	);

	useEffect(() => {
		if (session.formatNonce === 0 || !session.formatCommand) {
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
		setContent(sessionKey, next.value);
		requestAnimationFrame(() => {
			const area = textareaRef.current;
			if (!area) {
				return;
			}
			area.focus();
			area.setSelectionRange(next.selectionStart, next.selectionEnd);
		});
		patchSession(sessionKey, { formatCommand: null });
	}, [
		patchSession,
		session.content,
		session.formatCommand,
		session.formatNonce,
		session.viewMode,
		setContent,
		pushSourceHistory,
		sessionKey,
	]);

	useEffect(() => {
		if (session.undoNonce === 0) {
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
		setContent(sessionKey, previous);
		skipSourceHistoryRef.current = false;
	}, [session.undoNonce, session.viewMode, session.content, setContent, sessionKey]);

	useEffect(() => {
		if (session.redoNonce === 0) {
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
		setContent(sessionKey, next);
		skipSourceHistoryRef.current = false;
	}, [session.redoNonce, session.viewMode, session.content, setContent, sessionKey]);

	useEffect(() => {
		resetSourceHistory();
	}, [resetSourceHistory, session.loadedPath, session.viewMode]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return;
			}
			const key = event.key.toLowerCase();
			const viewMode = normalizeMarkdownViewMode(
				useMarkdownEditorStore.getState().sessions[sessionKey]?.viewMode,
			);
			const canEdit = viewMode !== 'reading';

			if (key === 's') {
				event.preventDefault();
				save();
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
				useMarkdownEditorStore.getState().requestUndo(sessionKey);
				return;
			}
			if ((key === 'z' && event.shiftKey) || key === 'y') {
				if (viewMode === 'live' && isTiptapTarget(event.target)) {
					return;
				}
				event.preventDefault();
				useMarkdownEditorStore.getState().requestRedo(sessionKey);
				return;
			}
			if (key === 'b') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(sessionKey, 'bold');
				return;
			}
			if (key === 'i') {
				event.preventDefault();
				useMarkdownEditorStore.getState().requestFormat(sessionKey, 'italic');
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [save, sessionKey]);

	const viewMode = normalizeMarkdownViewMode(session.viewMode);
	const showWysiwyg = showsMarkdownWysiwyg(viewMode);
	const showSource = showsMarkdownSource(viewMode);
	const showPreview = showsMarkdownPreview(viewMode);

	const handleFormatHandled = useCallback(() => {
		patchSession(sessionKey, { formatCommand: null });
	}, [patchSession, sessionKey]);

	const modeOptions = useMemo(
		() =>
			(['live', 'source', 'reading'] as MarkdownViewMode[]).map((mode) => ({
				value: mode,
				label: MARKDOWN_VIEW_MODE_LABELS[mode],
			})),
		[],
	);

	const isLoadingFile =
		Boolean(filePath) &&
		contentQuery.isLoading &&
		session.loadedPath !== filePath;
	const isLoadError =
		Boolean(filePath) && contentQuery.isError && session.loadedPath !== filePath;

	if (!filePath) {
		return (
			<Center h="100%">
				<Text c="dimmed">Выберите файл .md в дереве слева</Text>
			</Center>
		);
	}

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
				justify="space-between"
				style={{
					flexShrink: 0,
					borderBottom: '1px solid var(--mantine-color-default-border)',
				}}
			>
				<Group gap="sm" wrap="nowrap">
					<SegmentedControl
						size="xs"
						value={viewMode}
						onChange={(value) => setViewMode(sessionKey, value as MarkdownViewMode)}
						data={modeOptions}
					/>
					<Text size="xs" c="dimmed" lineClamp={1}>
						{filePath}
						{session.dirty ? ' *' : ''}
					</Text>
				</Group>
				<Group gap="xs" wrap="nowrap">
					{filePath ? (
						<Tooltip label={isBookmarked ? 'Убрать закладку' : 'Добавить закладку'}>
							<ActionIcon
								variant={isBookmarked ? 'filled' : 'subtle'}
								color={isBookmarked ? 'yellow' : undefined}
								onClick={() => bookmarkMutation.mutate(!isBookmarked)}
								loading={bookmarkMutation.isPending}
								disabled={!canWrite}
								aria-label={isBookmarked ? 'Убрать закладку' : 'Добавить закладку'}
							>
								{isBookmarked ? <IconBookmarkFilled size={16} /> : <IconBookmark size={16} />}
							</ActionIcon>
						</Tooltip>
					) : null}
					<FileButton onChange={handleUpload} accept="image/*,.pdf">
						{(props) => (
							<Tooltip label="Прикрепить файл">
								<ActionIcon
									{...props}
									variant="subtle"
									loading={uploadMutation.isPending}
									disabled={viewMode === 'reading'}
									aria-label="Прикрепить файл"
								>
									<IconPaperclip size={16} />
								</ActionIcon>
							</Tooltip>
						)}
					</FileButton>
					<Button
						size="compact-xs"
						variant="light"
						leftSection={<IconDeviceFloppy size={14} />}
						onClick={save}
						loading={saveMutation.isPending}
						disabled={!session.dirty}
					>
						Сохранить
					</Button>
				</Group>
			</Group>

			{isLoadingFile ? (
				<Center style={{ flex: 1 }} p="md">
					<Loader size="sm" />
				</Center>
			) : isLoadError ? (
				<Center style={{ flex: 1 }} p="md">
					<Stack gap="xs" align="center">
						<Text c="red">Не удалось загрузить файл</Text>
						<Button size="xs" variant="light" onClick={() => void contentQuery.refetch()}>
							Повторить
						</Button>
					</Stack>
				</Center>
			) : (
				<Box
					style={{
						flex: 1,
						minHeight: 0,
						overflow: 'hidden',
						position: 'relative',
					}}
				>
					{showWysiwyg ? (
						<MarkdownWysiwygEditor
							content={session.content}
							onChange={(value) => setContent(sessionKey, value)}
							formatNonce={session.formatNonce}
							formatCommand={session.formatCommand}
							undoNonce={session.undoNonce}
							redoNonce={session.redoNonce}
							onFormatHandled={handleFormatHandled}
							extraExtensions={editorExtensions}
							onEditorReady={handleEditorReady}
						/>
					) : null}
					{wikilinkAutocomplete && showWysiwyg ? (
						<WikilinkAutocompleteMenu
							state={wikilinkAutocomplete}
							suggestions={noteSuggestions}
							onSelect={handleAutocompleteSelect}
						/>
					) : null}
					{showSource ? (
						<Textarea
							ref={textareaRef}
							value={session.content}
							onChange={(event) => {
								const next = event.currentTarget.value;
								if (!skipSourceHistoryRef.current && next !== session.content) {
									pushSourceHistory(session.content);
								}
								setContent(sessionKey, next);
							}}
							autosize={false}
							placeholder="Исходный код Markdown"
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
								},
							}}
						/>
					) : null}
					{showPreview ? (
						<ScrollArea style={{ minHeight: 0, height: '100%' }} type="auto" offsetScrollbars>
							<MarkdownPreview
								content={session.content}
								variant="reading"
								onWikilinkClick={(title) => {
									void handleWikilinkClick(title);
								}}
								isBrokenWikilink={isBrokenWikilink}
							/>
						</ScrollArea>
					) : null}
				</Box>
			)}
		</Box>
	);
}
