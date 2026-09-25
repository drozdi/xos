import type { AppMenuConfig } from '@/core/appMenu/types';

const menu: AppMenuConfig = {
	layout: 'menu',
	items: [
		{
			id: 'file',
			type: 'submenu',
			label: 'Файл',
			items: [
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
