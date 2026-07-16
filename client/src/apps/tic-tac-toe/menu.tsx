import type { AppMenuConfig } from '@/core/appMenu/types';
import { getOrCreateCoreApi } from '@/core/context/coreApiRegistry';

import { openNewGameDialog } from './openNewGameDialog';
import { RulesContent } from './RulesContent';

function ReloadIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
			<path d="M21 3v5h-5" />
			<path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
			<path d="M3 21v-5h5" />
		</svg>
	);
}

function openNewGameFromMenu(ctx: { windowId?: string; appId: string }) {
	if (!ctx.windowId) {return;}
	openNewGameDialog(getOrCreateCoreApi(ctx.windowId, ctx.appId));
}

const menu: AppMenuConfig = {
	layout: 'combined',
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
	toolbarItems: [
		{
			id: 'toolbar-new-game',
			label: 'Новая игра',
			icon: <ReloadIcon />,
			onClick: openNewGameFromMenu,
		},
	],
};

export default menu;
