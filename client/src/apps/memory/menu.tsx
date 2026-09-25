import type { AppMenuConfig } from '@/core/appMenu/types';

import { useMemoryStore } from './store';

const menu: AppMenuConfig = {
	layout: 'menu',
	items: [
		{
			id: 'game',
			type: 'submenu',
			label: 'Игра',
			items: [
				{
					id: 'new-game',
					label: 'Новая игра',
					shortcut: 'Ctrl+N',
					onClick: () => useMemoryStore.getState().newGame(),
				},
			],
		},
	],
};

export default menu;
