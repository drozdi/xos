import type { ComponentType, ReactNode } from 'react';

import type { CoreApi } from '@/core/context/types';

export type AppMenuLayout = 'menu' | 'toolbar' | 'combined' | 'custom';

export interface AppMenuActionContext {
	appId: string;
	windowId: string;
	instanceKey: string;
	coreApi: CoreApi;
}

export interface AppMenuActionItem {
	id: string;
	type?: 'action';
	label: string;
	icon?: ReactNode;
	shortcut?: string;
	disabled?: boolean | ((ctx: AppMenuActionContext) => boolean);
	hidden?: boolean | ((ctx: AppMenuActionContext) => boolean);
	onClick?: (ctx: AppMenuActionContext) => void | Promise<void>;
}

export interface AppMenuSubmenuItem {
	id: string;
	type: 'submenu';
	label: string;
	icon?: ReactNode;
	disabled?: boolean | ((ctx: AppMenuActionContext) => boolean);
	hidden?: boolean | ((ctx: AppMenuActionContext) => boolean);
	items: AppMenuEntry[];
}

export interface AppMenuDividerItem {
	type: 'divider';
	id?: string;
}

export type AppMenuEntry = AppMenuActionItem | AppMenuSubmenuItem | AppMenuDividerItem;

export interface AppMenuComponentProps {
	context: AppMenuActionContext;
}

export interface AppMenuConfig {
	/** menu — выпадающие меню, toolbar — панель кнопок, combined — оба, custom — свой компонент */
	layout?: AppMenuLayout;
	items?: AppMenuEntry[] | ((ctx: AppMenuActionContext) => AppMenuEntry[]);
	/** Только для combined — отдельная панель инструментов */
	toolbarItems?: AppMenuEntry[] | ((ctx: AppMenuActionContext) => AppMenuEntry[]);
	component?: ComponentType<AppMenuComponentProps>;
}

export type AppMenuSource = AppMenuConfig | (() => Promise<AppMenuConfig>);

export function isAppMenuAction(entry: AppMenuEntry): entry is AppMenuActionItem {
	return !('type' in entry) || entry.type === 'action';
}

export function isAppMenuSubmenu(entry: AppMenuEntry): entry is AppMenuSubmenuItem {
	return 'type' in entry && entry.type === 'submenu';
}

export function isAppMenuDivider(entry: AppMenuEntry): entry is AppMenuDividerItem {
	return 'type' in entry && entry.type === 'divider';
}

export function isMenuEntryVisible(
	entry: AppMenuEntry,
	ctx: AppMenuActionContext,
): boolean {
	if (isAppMenuDivider(entry)) {
		return true;
	}

	const hidden = entry.hidden;
	if (typeof hidden === 'function') {
		return !hidden(ctx);
	}
	return !hidden;
}

export function isMenuEntryDisabled(
	entry: AppMenuActionItem | AppMenuSubmenuItem,
	ctx: AppMenuActionContext,
): boolean {
	const disabled = entry.disabled;
	if (typeof disabled === 'function') {
		return disabled(ctx);
	}
	return Boolean(disabled);
}
