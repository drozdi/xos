import type { AppMenuActionContext, AppMenuEntry, AppMenuSubmenuItem } from './types';
import { isAppMenuAction, isAppMenuDivider, isAppMenuSubmenu, isMenuEntryVisible } from './types';

function filterVisibleEntries(
	entries: AppMenuEntry[],
	ctx: AppMenuActionContext,
): AppMenuEntry[] {
	const result: AppMenuEntry[] = [];

	for (const entry of entries) {
		if (!isMenuEntryVisible(entry, ctx)) {
			continue;
		}

		if (isAppMenuSubmenu(entry)) {
			const items = filterVisibleEntries(entry.items, ctx);
			if (items.length === 0) {
				continue;
			}
			result.push({ ...entry, items });
			continue;
		}

		result.push(entry);
	}

	return result;
}

function trimDividers(entries: AppMenuEntry[]): AppMenuEntry[] {
	const result: AppMenuEntry[] = [];

	for (const entry of entries) {
		if (isAppMenuDivider(entry)) {
			if (result.length === 0 || isAppMenuDivider(result[result.length - 1]!)) {
				continue;
			}
			result.push(entry);
			continue;
		}

		result.push(entry);
	}

	if (result.length > 0 && isAppMenuDivider(result[result.length - 1]!)) {
		result.pop();
	}

	return result;
}

export function resolveAppMenuItems(
	items: AppMenuEntry[] | ((ctx: AppMenuActionContext) => AppMenuEntry[]) | undefined,
	ctx: AppMenuActionContext,
): AppMenuEntry[] {
	if (!items) {
		return [];
	}

	const resolved = typeof items === 'function' ? items(ctx) : items;
	return trimDividers(filterVisibleEntries(resolved, ctx));
}

export function hasVisibleMenuEntries(entries: AppMenuEntry[]): boolean {
	return entries.some((entry) => !isAppMenuDivider(entry));
}

export function groupMenuBarEntries(entries: AppMenuEntry[]): AppMenuSubmenuItem[] {
	const groups: AppMenuSubmenuItem[] = [];

	for (const entry of entries) {
		if (isAppMenuDivider(entry)) {
			continue;
		}

		if (isAppMenuSubmenu(entry)) {
			groups.push(entry);
			continue;
		}

		if (isAppMenuAction(entry)) {
			groups.push({
				id: entry.id,
				type: 'submenu',
				label: entry.label,
				icon: entry.icon,
				disabled: entry.disabled,
				hidden: entry.hidden,
				items: [entry],
			});
		}
	}

	return groups;
}
