import type { AppManifest } from '@/core/appManager/types';

import {
	applyTaskbarStateToBaseItems,
	applyTaskbarWindowItemToBaseItems,
	applyWindowStateToBaseItems,
	buildBaseTaskbarMenuItems,
	buildBaseWindowMenuItems,
} from './baseItems';
import type {
	ContextMenuContext,
	ContextMenuDividerDef,
	ContextMenuEntry,
	ContextMenuItemDef,
	ContextMenuScope,
} from './types';
import { isContextMenuDivider, isContextMenuItem } from './types';

function applyOverrides<T extends string>(
	baseItems: ContextMenuItemDef[],
	overrides: Partial<Record<T, ContextMenuItemDef | false>> | undefined,
): ContextMenuItemDef[] {
	if (!overrides) {
		return baseItems;
	}

	return baseItems.flatMap((item) => {
		const override = overrides[item.id as T];
		if (override === false) {
			return [];
		}
		if (override) {
			return [{ ...item, ...override, id: item.id }];
		}
		return [item];
	});
}

function appendCustomEntries(
	items: ContextMenuEntry[],
	customEntries: ContextMenuEntry[] | undefined,
): ContextMenuEntry[] {
	if (!customEntries?.length) {
		return items;
	}

	const visibleCustom = customEntries.filter(
		(entry) => isContextMenuDivider(entry) || !entry.hidden,
	);
	if (visibleCustom.length === 0) {
		return items;
	}

	const divider: ContextMenuDividerDef = { type: 'divider', id: 'custom' };
	return [...items, divider, ...visibleCustom];
}

function buildBaseEntries(scope: ContextMenuScope, ctx: ContextMenuContext): ContextMenuItemDef[] {
	if (scope === 'window') {
		return applyWindowStateToBaseItems(buildBaseWindowMenuItems(), ctx);
	}
	if (scope === 'taskbar' && ctx.window && ctx.windows?.length === 1) {
		return applyTaskbarWindowItemToBaseItems(buildBaseTaskbarMenuItems(), ctx);
	}
	return applyTaskbarStateToBaseItems(buildBaseTaskbarMenuItems(), ctx);
}

export function resolveContextMenuItems(
	scope: ContextMenuScope,
	ctx: ContextMenuContext,
	manifest: AppManifest,
): ContextMenuEntry[] {
	const config = manifest.contextMenu;
	const overrides =
		scope === 'window' ? config?.windowOverrides : config?.taskbarOverrides;
	const customFactory = scope === 'window' ? config?.window : config?.taskbar;

	const baseItems = applyOverrides(buildBaseEntries(scope, ctx), overrides);
	const customEntries = customFactory?.(ctx);

	return appendCustomEntries(baseItems, customEntries);
}

export function getVisibleContextMenuItems(entries: ContextMenuEntry[]): ContextMenuItemDef[] {
	return entries.filter(isContextMenuItem).filter((item) => !item.hidden);
}
