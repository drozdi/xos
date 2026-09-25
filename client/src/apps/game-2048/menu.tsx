import type { AppMenuConfig } from '@/core/appMenu/types';

import { useGame2048Store } from './store';

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
					onClick: () => useGame2048Store.getState().newGame(),
				},
			],
		},
	],
};

export default menu;
