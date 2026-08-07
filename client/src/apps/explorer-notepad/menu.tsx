import type { AppMenuConfig } from '@/core/appMenu/types';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';

import { useNotepadEditorStore } from './notepadEditorStore';


const NOTEPAD_FILE_TYPES = ['text'];


const menu: AppMenuConfig = {
	layout: 'menu',
	items: [
		{
			id: 'file',
			type: 'submenu',
			label: 'Файл',
			items: [
				{
					id: 'file-open',
					label: 'Открыть…',
					shortcut: 'Ctrl+O',
					onClick: async (ctx) => {
						const session = useNotepadEditorStore.getState().getSession(ctx.windowId);
						await openExplorerPicker({
							mode: 'open',
							consumerAppId: ctx.appId,
							fileTypes: NOTEPAD_FILE_TYPES,
							initialPath: session.path ?? undefined,
							title: 'Открыть файл',
						});
					},
				},
				{
					id: 'file-save',
					label: 'Сохранить',
					shortcut: 'Ctrl+S',
					disabled: (ctx) => {
						const session = useNotepadEditorStore.getState().getSession(ctx.windowId);
						return !session.path || !session.dirty;
					},
					onClick: (ctx) => {
						useNotepadEditorStore.getState().requestSave(ctx.windowId);
					},
				},
				{
					id: 'file-save-as',
					label: 'Сохранить как…',
					onClick: (ctx) => {
						useNotepadEditorStore.getState().requestSaveAs(ctx.windowId);
					},
				},
				{
					id: 'file-close',
					label: 'Закрыть',
					onClick: (ctx) => {
						void ctx.coreApi.window.close();
					},
				},
			],
		},
	],
};


export default menu;
