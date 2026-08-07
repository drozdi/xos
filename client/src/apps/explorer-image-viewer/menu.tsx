import type { AppMenuConfig } from '@/core/appMenu/types';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';

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
							consumerAppId: ctx.appId,
							fileTypes: ['image'],
							title: 'Открыть изображение',
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
