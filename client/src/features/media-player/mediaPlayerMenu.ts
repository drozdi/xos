import type { AppMenuConfig } from '@/core/appMenu/types';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { explorerOpenPickerConsumerId } from '@/features/explorer/useExplorerSatelliteFile';

import { scheduleCloseMediaPlayerWindow } from './closeMediaPlayerWindow';
import { useMediaPlayerStore } from './mediaPlayerStore';
import type { MediaPlayerKind } from './playlistFormat';

interface CreateMediaPlayerMenuOptions {
	kind: MediaPlayerKind;
	appId: string;
	fileTypes: string[];
	openMediaLabel: string;
	openMediaTitle: string;
}

export function createMediaPlayerMenu({
	kind,
	appId,
	fileTypes,
	openMediaLabel,
	openMediaTitle,
}: CreateMediaPlayerMenuOptions): AppMenuConfig {
	return {
		layout: 'menu',
		items: [
			{
				id: 'file',
				type: 'submenu',
				label: 'Файл',
				items: [
					{
						id: 'file-open',
						label: openMediaLabel,
						shortcut: 'Ctrl+O',
						onClick: async (ctx) => {
							const session = useMediaPlayerStore.getState().getSession(ctx.windowId, kind);
							await openExplorerPicker({
								mode: 'open',
								consumerAppId: explorerOpenPickerConsumerId(appId, ctx.windowId),
								fileTypes,
								initialPath: session.currentPath ?? undefined,
								title: openMediaTitle,
							});
						},
					},
					{
						id: 'file-close',
						label: 'Закрыть',
						onClick: (ctx) => {
							scheduleCloseMediaPlayerWindow(ctx.windowId, true);
						},
					},
				],
			},
			{
				id: 'playlist',
				type: 'submenu',
				label: 'Плейлист',
				items: [
					{
						id: 'playlist-open',
						label: 'Открыть плейлист…',
						shortcut: 'Ctrl+Shift+O',
						onClick: (ctx) => {
							useMediaPlayerStore.getState().requestOpenPlaylist(ctx.windowId);
						},
					},
					{
						id: 'playlist-save',
						label: 'Сохранить',
						shortcut: 'Ctrl+S',
						disabled: (ctx) => {
							const session = useMediaPlayerStore.getState().getSession(ctx.windowId, kind);
							return session.items.length === 0 || (!session.dirty && Boolean(session.playlistPath));
						},
						onClick: (ctx) => {
							useMediaPlayerStore.getState().requestSave(ctx.windowId);
						},
					},
					{
						id: 'playlist-save-as',
						label: 'Сохранить как…',
						shortcut: 'Ctrl+Shift+S',
						onClick: (ctx) => {
							useMediaPlayerStore.getState().requestSaveAs(ctx.windowId);
						},
					},
					{ id: 'playlist-sep1', type: 'divider' },
					{
						id: 'playlist-new',
						label: 'Новый плейлист',
						onClick: (ctx) => {
							useMediaPlayerStore.getState().requestNewPlaylist(ctx.windowId);
						},
					},
					{
						id: 'playlist-add',
						label: 'Добавить файлы…',
						onClick: (ctx) => {
							useMediaPlayerStore.getState().requestAddFiles(ctx.windowId);
						},
					},
				],
			},
		],
	};
}
