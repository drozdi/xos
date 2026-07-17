import type { AppMenuConfig } from '@/core/appMenu/types';

import { RulesContent } from './RulesContent';
import { useChessStore } from './chessStore';

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
					onClick: () => {
						useChessStore.getState().requestRestart();
					},
				},
			],
		},
		{
			id: 'help',
			type: 'submenu',
			label: 'Справка',
			items: [
				{
					id: 'rules',
					label: 'Правила',
					onClick: (ctx) => {
						ctx.coreApi.window.createChildWindow({
							title: 'Правила шахмат',
							width: 480,
							height: 520,
							content: <RulesContent />,
						});
					},
				},
			],
		},
	],
};

export default menu;
