import type { AppMenuConfig } from '@/core/appMenu/types';

import { useSnakeStore } from './store';

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
					onClick: () => useSnakeStore.getState().newGame(),
				},
				{
					id: 'pause',
					label: 'Пауза',
					shortcut: 'Space',
					onClick: () => useSnakeStore.getState().togglePause(),
				},
			],
		},
	],
};

export default menu;
