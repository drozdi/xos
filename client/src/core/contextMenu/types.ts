import type { ReactNode } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import type { WindowState } from '@/core/windowManager/types';

export type ContextMenuScope = 'window' | 'taskbar';

export type BaseWindowMenuActionId =
	| 'close'
	| 'minimize'
	| 'maximize'
	| 'restore'
	| 'refresh';

export type BaseTaskbarMenuActionId =
	| 'restore'
	| 'minimize'
	| 'new-window'
	| 'close'
	| 'close-all';

export interface ContextMenuContext {
	scope: ContextMenuScope;
	appId: string;
	manifest: AppManifest;
	windowId?: string;
	instanceKey?: string;
	window?: WindowState;
	windows?: WindowState[];
	wmGroup?: string;
}

export interface ContextMenuItemDef {
	id: string;
	label: string;
	icon?: ReactNode;
	disabled?: boolean;
	hidden?: boolean;
	danger?: boolean;
	onClick: (ctx: ContextMenuContext) => void | Promise<void>;
}

export interface ContextMenuDividerDef {
	type: 'divider';
	id?: string;
}

export type ContextMenuEntry = ContextMenuItemDef | ContextMenuDividerDef;

export interface ContextMenuConfig {
	/** Дополнительные пункты в контекстном меню окна */
	window?: (ctx: ContextMenuContext) => ContextMenuEntry[];
	/** Дополнительные пункты в контекстном меню taskbar */
	taskbar?: (ctx: ContextMenuContext) => ContextMenuEntry[];
	/** Переопределение или отключение базовых пунктов окна (false = скрыть) */
	windowOverrides?: Partial<Record<BaseWindowMenuActionId, ContextMenuItemDef | false>>;
	/** Переопределение или отключение базовых пунктов taskbar (false = скрыть) */
	taskbarOverrides?: Partial<Record<BaseTaskbarMenuActionId, ContextMenuItemDef | false>>;
}

export function isContextMenuItem(entry: ContextMenuEntry): entry is ContextMenuItemDef {
	return !('type' in entry);
}

export function isContextMenuDivider(entry: ContextMenuEntry): entry is ContextMenuDividerDef {
	return 'type' in entry && entry.type === 'divider';
}
