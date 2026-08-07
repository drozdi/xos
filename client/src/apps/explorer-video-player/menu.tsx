import type { AppMenuConfig } from '@/core/appMenu/types';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { explorerOpenPickerConsumerId } from '@/features/explorer/useExplorerSatelliteFile';

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
						await openExplorerPicker({
							mode: 'open',
							consumerAppId: explorerOpenPickerConsumerId(ctx.appId, ctx.windowId),
							fileTypes: ['video'],
							title: 'Открыть видеофайл',
						});
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
