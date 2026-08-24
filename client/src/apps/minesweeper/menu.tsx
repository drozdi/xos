import type { AppMenuConfig } from '@/core/appMenu/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { DIFFICULTIES, getWindowSizeForBoard } from './difficulty';
import { openNewGameDialog } from './openNewGameDialog';
import { RulesContent } from './RulesContent';
import { useMinesweeperStore } from './store';

function openNewGameFromMenu(ctx: { windowId?: string; appId: string }) {
	if (!ctx.windowId) {
		return;
	}
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
					label: 'Новая игра…',
					shortcut: 'Ctrl+N',
					onClick: openNewGameFromMenu,
				},
				{ id: 'sep-diff', type: 'divider' },
				...DIFFICULTIES.map((difficulty) => ({
					id: `diff-${difficulty.id}`,
					label: difficulty.label,
					onClick: (ctx: { windowId?: string; appId: string }) => {
						if (!ctx.windowId) {
							return;
						}
						useMinesweeperStore.getState().startGame(difficulty);
						const size = getWindowSizeForBoard(difficulty);
						getOrCreateCoreApi(ctx.windowId, ctx.appId).window.setSize(size.width, size.height);
					},
				})),
			],
		},
		{
			id: 'help',
			type: 'submenu',
			label: 'Справка',
			items: [
				{
					id: 'about',
					label: 'Правила',
					onClick: (ctx) => {
						ctx.coreApi.window.createChildWindow({
							title: 'Правила игры',
							width: 360,
							height: 320,
							content: <RulesContent />,
						});
					},
				},
			],
		},
	],
};

export default menu;
