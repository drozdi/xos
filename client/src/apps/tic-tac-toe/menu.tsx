import type { AppMenuConfig } from '@/core/appMenu/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { openNewGameDialog } from './openNewGameDialog';
import { RulesContent } from './RulesContent';

function openNewGameFromMenu(ctx: { windowId?: string; appId: string }) {
	if (!ctx.windowId) {return;}
	openNewGameDialog(getOrCreateCoreApi(ctx.windowId, ctx.appId));
}

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
					onClick: openNewGameFromMenu,
				},
			],
		},
		{
			id: 'help',
			type: 'submenu',
			label: 'Справка',
			items: [
				{
					id: 'about',
					label: 'О нас',
					onClick: (ctx) => {
						ctx.coreApi.window.createChildWindow({
							title: 'Правила игры',
							width: 360,
							height: 360,
							content: <RulesContent />,
						});
					},
				},
			],
		},
	],
};

export default menu;
