import { useAppManager } from '@/core/appManager/useAppManager';
import { shouldMinimizeGroup } from '@/core/taskbar/taskbarUtils';
import { getWindowApi } from '@/core/windowManager/windowApiRegistry';
import { useWmStore } from '@/core/windowManager/useWmStore';

import type {
	BaseTaskbarMenuActionId,
	BaseWindowMenuActionId,
	ContextMenuContext,
	ContextMenuItemDef,
} from './types';

function getWindowApiOrThrow(windowId: string) {
	const api = getWindowApi(windowId);
	if (!api) {
		throw new Error(`Window API is not available for "${windowId}"`);
	}
	return api;
}

export function buildBaseWindowMenuItems(): Record<BaseWindowMenuActionId, ContextMenuItemDef> {
	return {
		close: {
			id: 'close',
			label: 'Close',
			danger: true,
			onClick: async (ctx) => {
				if (!ctx.windowId) {return;}
				await getWindowApiOrThrow(ctx.windowId).close();
			},
		},
		minimize: {
			id: 'minimize',
			label: 'Minimize',
			hidden: true,
			onClick: (ctx) => {
				if (!ctx.windowId) {return;}
				getWindowApiOrThrow(ctx.windowId).minimize();
			},
		},
		maximize: {
			id: 'maximize',
			label: 'Maximize',
			hidden: true,
			onClick: (ctx) => {
				if (!ctx.windowId) {return;}
				getWindowApiOrThrow(ctx.windowId).maximize();
			},
		},
		restore: {
			id: 'restore',
			label: 'Restore',
			hidden: true,
			onClick: (ctx) => {
				if (!ctx.windowId) {return;}
				getWindowApiOrThrow(ctx.windowId).restore();
			},
		},
		refresh: {
			id: 'refresh',
			label: 'Refresh',
			onClick: (ctx) => {
				if (!ctx.windowId) {return;}
				getWindowApiOrThrow(ctx.windowId).refresh();
			},
		},
	};
}

export function buildBaseTaskbarMenuItems(): Record<BaseTaskbarMenuActionId, ContextMenuItemDef> {
	return {
		restore: {
			id: 'restore',
			label: 'Restore',
			onClick: (ctx) => {
				if (!ctx.wmGroup) {return;}
				useWmStore.getState().restoreGroup(ctx.wmGroup);
			},
		},
		minimize: {
			id: 'minimize',
			label: 'Minimize',
			onClick: (ctx) => {
				if (!ctx.wmGroup) {return;}
				useWmStore.getState().minimizeGroup(ctx.wmGroup);
			},
		},
		'new-window': {
			id: 'new-window',
			label: 'New window',
			onClick: async (ctx) => {
				await useAppManager.getState().launchApp(ctx.appId);
			},
		},
		close: {
			id: 'close',
			label: 'Close',
			danger: true,
			hidden: true,
			onClick: async (ctx) => {
				if (!ctx.windowId) {return;}
				await getWindowApiOrThrow(ctx.windowId).close();
			},
		},
		'close-all': {
			id: 'close-all',
			label: 'Close all',
			danger: true,
			onClick: async (ctx) => {
				const windows = ctx.windows ?? [];
				for (const window of windows) {
					await getWindowApi(window.id)?.close();
				}
			},
		},
	};
}

export function applyWindowStateToBaseItems(
	items: Record<BaseWindowMenuActionId, ContextMenuItemDef>,
	ctx: ContextMenuContext,
): ContextMenuItemDef[] {
	const window = ctx.window;
	if (!window) {
		return Object.values(items).filter((item) => !item.hidden);
	}

	const next = { ...items };

	if (window.minimized || window.maximized) {
		next.restore = { ...next.restore, hidden: false };
		next.minimize = { ...next.minimize, hidden: true };
		next.maximize = { ...next.maximize, hidden: true };
	} else {
		next.restore = { ...next.restore, hidden: true };
		next.minimize = { ...next.minimize, hidden: false };
		next.maximize = { ...next.maximize, hidden: false };
	}

	next.close = { ...next.close, hidden: false };

	return Object.values(next).filter((item) => !item.hidden);
}

export function applyTaskbarWindowItemToBaseItems(
	items: Record<BaseTaskbarMenuActionId, ContextMenuItemDef>,
	ctx: ContextMenuContext,
): ContextMenuItemDef[] {
	const window = ctx.window;
	if (!window) {
		return applyTaskbarStateToBaseItems(items, ctx);
	}

	const next = { ...items };

	if (window.minimized) {
		next.restore = {
			...next.restore,
			label: 'Restore',
			hidden: false,
			onClick: (menuCtx) => {
				if (!menuCtx.windowId) {return;}
				getWindowApiOrThrow(menuCtx.windowId).restore();
				useWmStore.getState().focusWindow(menuCtx.windowId);
			},
		};
	} else {
		next.restore = {
			...next.restore,
			label: 'Minimize',
			hidden: false,
			onClick: (menuCtx) => {
				if (!menuCtx.windowId) {return;}
				getWindowApiOrThrow(menuCtx.windowId).minimize();
			},
		};
	}

	next.minimize = { ...next.minimize, hidden: true };
	next.close = {
		...next.close,
		hidden: false,
		onClick: async (menuCtx) => {
			if (!menuCtx.windowId) {return;}
			await getWindowApiOrThrow(menuCtx.windowId).close();
		},
	};
	next['close-all'] = { ...next['close-all'], hidden: true };
	next['new-window'] = {
		...next['new-window'],
		hidden: Boolean(ctx.manifest.singleInstance),
	};

	return Object.values(next).filter((item) => !item.hidden);
}

export function applyTaskbarStateToBaseItems(
	items: Record<BaseTaskbarMenuActionId, ContextMenuItemDef>,
	ctx: ContextMenuContext,
): ContextMenuItemDef[] {
	const groupWindows = ctx.windows ?? [];
	const minimizeGroup = shouldMinimizeGroup(groupWindows);
	const canOpenNew = !ctx.manifest.singleInstance;

	const next = { ...items };

	next.restore = {
		...next.restore,
		label: minimizeGroup ? 'Minimize all' : 'Restore all',
		hidden: groupWindows.length === 0,
		onClick: (menuCtx) => {
			if (!menuCtx.wmGroup) {return;}
			if (minimizeGroup) {
				useWmStore.getState().minimizeGroup(menuCtx.wmGroup);
				return;
			}
			useWmStore.getState().restoreGroup(menuCtx.wmGroup);
		},
	};

	next.minimize = { ...next.minimize, hidden: true };

	next['new-window'] = {
		...next['new-window'],
		hidden: !canOpenNew,
	};

	if (groupWindows.length === 1) {
		const onlyWindow = groupWindows[0];
		next.close = {
			...next.close,
			hidden: false,
			onClick: async () => {
				if (!onlyWindow) {return;}
				await getWindowApi(onlyWindow.id)?.close();
			},
		};
		next['close-all'] = { ...next['close-all'], hidden: true };
	} else {
		next.close = { ...next.close, hidden: true };
		next['close-all'] = {
			...next['close-all'],
			hidden: groupWindows.length === 0,
		};
	}

	return Object.values(next).filter((item) => !item.hidden);
}
