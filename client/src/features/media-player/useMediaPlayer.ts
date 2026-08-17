import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect } from 'react';
import { useAppContext } from '@/core/context/AppContext';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWmStore } from '@/core/windowManager/useWmStore';
import { saveExplorerText } from '@/features/explorer/explorerApi';
import { getExplorerFolderPath } from '@/features/explorer/explorerPathUtils';
import { invalidateExplorerFolder } from '@/features/explorer/explorerQueryUtils';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerMediaUrl } from '@/features/explorer/useExplorerMediaUrl';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

import {
	mediaPlayerAddFilesConsumer,
	mediaPlayerOpenPlaylistConsumer,
	mediaPlayerSaveAsConsumer,
	useMediaPlayerStore,
} from './mediaPlayerStore';
import { closeMediaPlayerWindow } from './closeMediaPlayerWindow';
import { promptMediaPlayerCloseModal } from './promptMediaPlayerCloseModal';import {
	isPlaylistFile,
	parsePlaylistFile,
	PLAYLIST_EXTENSION,
	playlistNameFromPath,
	serializePlaylistFile,
	type MediaPlayerKind,
} from './playlistFormat';

interface UseMediaPlayerOptions {
	appId: string;
	kind: MediaPlayerKind;
	fileTypes: string[];
}

export function useMediaPlayer({ appId, kind, fileTypes }: UseMediaPlayerOptions) {
	const { windowId } = useAppContext();
	const coreApi = useCoreApi();
	const activeWindowId = useWmStore((state) => state.activeWindowId);
	const isActive = activeWindowId === windowId;
	const queryClient = useQueryClient();
	const { currentPath: satellitePath } = useExplorerSatelliteFile({
		appId,
		fileTypes,
		extensions: [PLAYLIST_EXTENSION],
	});

	const session = useMediaPlayerStore((state) => state.sessions[windowId] ?? state.getSession(windowId, kind));
	const patchSession = useMediaPlayerStore((state) => state.patchSession);
	const addItem = useMediaPlayerStore((state) => state.addItem);
	const setCurrentPath = useMediaPlayerStore((state) => state.setCurrentPath);
	const loadPlaylist = useMediaPlayerStore((state) => state.loadPlaylist);

	const saveAsConsumerId = mediaPlayerSaveAsConsumer(appId, windowId);
	const openPlaylistConsumerId = mediaPlayerOpenPlaylistConsumer(appId, windowId);
	const addFilesConsumerId = mediaPlayerAddFilesConsumer(appId, windowId);

	useEffect(() => {
		useMediaPlayerStore.getState().ensureSession(windowId, kind);
	}, [kind, windowId]);

	/** Сброс «залипших» nonce после закрытия без clearSession (taskbar и т.п.). */
	useLayoutEffect(() => {
		patchSession(windowId, {
			saveNonce: 0,
			saveAsNonce: 0,
			openPlaylistNonce: 0,
			addFilesNonce: 0,
			newPlaylistNonce: 0,
		});
	}, [windowId, patchSession]);

	const loadPlaylistFromPath = useCallback(
		async (path: string) => {
			try {
				const content = await fetchExplorerText(path);
				const parsed = parsePlaylistFile(content, kind);
				const firstItem = parsed.items[0] ?? null;
				loadPlaylist(windowId, path, parsed.name, parsed.items, firstItem);
				notifications.show({ color: 'green', message: 'Плейлист загружен' });
			} catch (error) {
				notifications.show({
					color: 'red',
					message: error instanceof Error ? error.message : 'Не удалось загрузить плейлист',
				});
			}
		},
		[kind, loadPlaylist, windowId],
	);

	useEffect(() => {
		if (!satellitePath) {
			return;
		}
		if (isPlaylistFile(satellitePath)) {
			void loadPlaylistFromPath(satellitePath);
			return;
		}
		addItem(windowId, satellitePath);
		setCurrentPath(windowId, satellitePath);
	}, [satellitePath, addItem, setCurrentPath, windowId, loadPlaylistFromPath]);

	useExplorerPickerResult(openPlaylistConsumerId, (path) => {
		void loadPlaylistFromPath(path);
	});

	useExplorerPickerResult(addFilesConsumerId, (path) => {
		addItem(windowId, path);
		if (!useMediaPlayerStore.getState().getSession(windowId, kind).currentPath) {
			setCurrentPath(windowId, path);
		}
	});

	const openSaveAsPicker = useCallback(async () => {
		const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
		const defaultName = latest.playlistPath
			? `${playlistNameFromPath(latest.playlistPath)}.${PLAYLIST_EXTENSION}`
			: `${latest.playlistName}.${PLAYLIST_EXTENSION}`;
		await openExplorerPicker({
			mode: 'save',
			consumerAppId: saveAsConsumerId,
			extensions: [PLAYLIST_EXTENSION],
			initialPath: latest.playlistPath ?? undefined,
			defaultFileName: defaultName,
			title: 'Сохранить плейлист',
		});
	}, [kind, saveAsConsumerId, windowId]);

	const savePlaylist = useCallback(
		async (targetPath?: string) => {
			const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
			const path = targetPath ?? latest.playlistPath;
			if (!path) {
				await openSaveAsPicker();
				return;
			}
			try {
				const content = serializePlaylistFile({
					version: 1,
					kind,
					name: latest.playlistName,
					items: latest.items,
				});
				await saveExplorerText(path, content);
				await invalidateExplorerFolder(queryClient, getExplorerFolderPath(path));
				patchSession(windowId, { playlistPath: path, dirty: false });
				notifications.show({ color: 'green', message: 'Плейлист сохранён' });
			} catch {
				notifications.show({ color: 'red', message: 'Не удалось сохранить плейлист' });
			}
		},
		[kind, openSaveAsPicker, patchSession, queryClient, windowId],
	);

	useExplorerPickerResult(saveAsConsumerId, (path) => {
		const normalized = path.toLowerCase().endsWith(`.${PLAYLIST_EXTENSION}`)
			? path
			: `${path}.${PLAYLIST_EXTENSION}`;
		void savePlaylist(normalized);
	});

	const openPlaylistPicker = useCallback(async () => {
		const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: openPlaylistConsumerId,
			extensions: [PLAYLIST_EXTENSION],
			initialPath: latest.playlistPath ?? undefined,
			title: 'Открыть плейлист',
		});
	}, [kind, openPlaylistConsumerId, windowId]);

	const openAddFilesPicker = useCallback(async () => {
		const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: addFilesConsumerId,
			fileTypes,
			initialPath: latest.currentPath ?? latest.items[0] ?? undefined,
			title: 'Добавить в плейлист',
		});
	}, [addFilesConsumerId, fileTypes, kind, windowId]);

	useEffect(() => {
		if (session.saveNonce === 0) {
			return;
		}
		patchSession(windowId, { saveNonce: 0 });
		void savePlaylist();
	}, [session.saveNonce, patchSession, savePlaylist, windowId]);

	useEffect(() => {
		if (session.saveAsNonce === 0) {
			return;
		}
		patchSession(windowId, { saveAsNonce: 0 });
		void openSaveAsPicker();
	}, [session.saveAsNonce, openSaveAsPicker, patchSession, windowId]);

	useEffect(() => {
		if (session.openPlaylistNonce === 0) {
			return;
		}
		patchSession(windowId, { openPlaylistNonce: 0 });
		void openPlaylistPicker();
	}, [session.openPlaylistNonce, openPlaylistPicker, patchSession, windowId]);

	useEffect(() => {
		if (session.addFilesNonce === 0) {
			return;
		}
		patchSession(windowId, { addFilesNonce: 0 });
		void openAddFilesPicker();
	}, [session.addFilesNonce, openAddFilesPicker, patchSession, windowId]);

	useEffect(() => {
		if (session.newPlaylistNonce === 0) {
			return;
		}
		patchSession(windowId, { newPlaylistNonce: 0 });
		useMediaPlayerStore.getState().resetPlaylist(windowId, kind);
	}, [session.newPlaylistNonce, kind, patchSession, windowId]);

	const promptCloseWithSave = useCallback(() => {
		promptMediaPlayerCloseModal({
			onSave: async () => {
				await savePlaylist();
				const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
				if (!latest.dirty) {
					await closeMediaPlayerWindow(windowId, true);
				}
			},
			onDiscard: () => closeMediaPlayerWindow(windowId, true),
		});
	}, [kind, savePlaylist, windowId]);
	useEffect(() => {
		return coreApi.window.on('close', () => {
			const latest = useMediaPlayerStore.getState().getSession(windowId, kind);
			if (!latest.dirty) {
				useMediaPlayerStore.getState().clearSession(windowId);
				return;
			}
			promptCloseWithSave();
			return false;
		});
	}, [coreApi, kind, promptCloseWithSave, windowId]);

	useEffect(() => {
		if (!isActive) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return;
			}
			const key = event.key.toLowerCase();
			const shift = event.shiftKey;
			if (key === 's' && shift) {
				event.preventDefault();
				useMediaPlayerStore.getState().requestSaveAs(windowId);
				return;
			}
			if (key === 's') {
				event.preventDefault();
				useMediaPlayerStore.getState().requestSave(windowId);
				return;
			}
			if (key === 'o' && shift) {
				event.preventDefault();
				useMediaPlayerStore.getState().requestOpenPlaylist(windowId);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isActive, windowId]);

	const mediaUrl = useExplorerMediaUrl(session.currentPath);

	return {
		session,
		mediaUrl,
		savePlaylist,
		openSaveAsPicker,
		openPlaylistPicker,
		openAddFilesPicker,
	};
}
