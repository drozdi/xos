import { Box, Button, Center, Group, Loader, Stack, Text, Textarea } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';


import { useAppContext } from '@/core/context/AppContext';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { saveExplorerText } from '@/features/explorer/explorerApi';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';


import {
	NOTEPAD_SAVE_AS_CONSUMER,
	useNotepadEditorStore,
} from './notepadEditorStore';


const NOTEPAD_FILE_TYPES = ['text'];

function notepadQueryKey(path: string) {
	return ['explorer', 'notepad', path] as const;
}


export default function ExplorerNotepadApp() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApi();
	const queryClient = useQueryClient();
	const saveAsConsumerId = `${NOTEPAD_SAVE_AS_CONSUMER}:${windowId}`;
	const { currentPath, setCurrentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-notepad',
		fileTypes: NOTEPAD_FILE_TYPES,
	});


	const session = useNotepadEditorStore((state) => state.getSession(windowId));
	const ensureSession = useNotepadEditorStore((state) => state.ensureSession);
	const setPath = useNotepadEditorStore((state) => state.setPath);
	const setContent = useNotepadEditorStore((state) => state.setContent);
	const markLoaded = useNotepadEditorStore((state) => state.markLoaded);
	const patchSession = useNotepadEditorStore((state) => state.patchSession);


	const syncNotepadQueryCache = useCallback(
		(path: string, content: string) => {
			queryClient.setQueryData(notepadQueryKey(path), content);
		},
		[queryClient],
	);


	useEffect(() => {
		ensureSession(windowId);
	}, [ensureSession, windowId]);


	useEffect(() => {
		setPath(windowId, currentPath);
	}, [currentPath, setPath, windowId]);


	const fileName = currentPath ? getExplorerFileName(currentPath) : 'Блокнот';
	useWindowTitle(session.dirty ? `${fileName} *` : fileName);


	const contentQuery = useQuery({
		queryKey: notepadQueryKey(currentPath ?? ''),
		queryFn: () => fetchExplorerText(currentPath!),
		enabled: Boolean(currentPath),
	});


	useEffect(() => {
		if (!currentPath || !contentQuery.isSuccess || contentQuery.data === undefined) {
			return;
		}
		const existing = useNotepadEditorStore.getState().getSession(windowId);
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
		const latest = useNotepadEditorStore.getState().getSession(windowId);
		const defaultName = latest.path
			? getExplorerFileName(latest.path)
			: 'note.txt';
		await openExplorerPicker({
			mode: 'save',
			consumerAppId: saveAsConsumerId,
			fileTypes: NOTEPAD_FILE_TYPES,
			initialPath: latest.path ?? undefined,
			defaultFileName: defaultName,
			title: 'Сохранить файл',
		});
	}, [saveAsConsumerId, windowId]);


	const save = useCallback(async () => {
		const latest = useNotepadEditorStore.getState().getSession(windowId);
		if (!latest.path) {
			patchSession(windowId, { closeAfterSaveAs: false });
			await openSaveAsPicker();
			return;
		}
		try {
			await saveExplorerText(latest.path, latest.content);
			syncNotepadQueryCache(latest.path, latest.content);
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
	}, [openSaveAsPicker, patchSession, syncNotepadQueryCache, windowId]);


	const forceCloseWindow = useCallback(() => {
		useNotepadEditorStore.getState().clearSession(windowId);
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
									const latest = useNotepadEditorStore.getState().getSession(windowId);
									if (!latest.path) {
										useNotepadEditorStore.getState().patchSession(windowId, {
											closeAfterSaveAs: true,
										});
										await openSaveAsPicker();
										return;
									}
									try {
										await saveExplorerText(latest.path, latest.content);
										syncNotepadQueryCache(latest.path, latest.content);
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
						<Button
							variant="default"
							onClick={() => {
								modals.close(modalId);
								useNotepadEditorStore.getState().patchSession(windowId, {
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
	}, [forceCloseWindow, openSaveAsPicker, syncNotepadQueryCache, windowId]);


	useExplorerPickerResult(saveAsConsumerId, (path) => {
		void (async () => {
			const latest = useNotepadEditorStore.getState().getSession(windowId);
			try {
				await saveExplorerText(path, latest.content);
				syncNotepadQueryCache(path, latest.content);
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
				useNotepadEditorStore.getState().patchSession(windowId, {
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
			const latest = useNotepadEditorStore.getState().getSession(windowId);
			if (!latest.dirty) {
				useNotepadEditorStore.getState().clearSession(windowId);
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
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [openFile, save]);


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
				<Textarea
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
							resize: 'none',
						},
					}}
				/>
			)}
		</Box>
	);
}
