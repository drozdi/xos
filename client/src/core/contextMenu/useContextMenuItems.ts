import { useMemo } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useAppContext } from '@/core/context/AppContext';
import { useWmStore } from '@/core/windowManager/useWmStore';
import type { WindowState } from '@/core/windowManager/types';

import { resolveContextMenuItems } from './resolveMenuItems';
import type { ContextMenuContext, ContextMenuDividerDef, ContextMenuEntry, ContextMenuScope } from './types';

interface UseContextMenuItemsOptions {
	scope: ContextMenuScope;
	appId: string;
	windowId?: string;
	instanceKey?: string;
	window?: WindowState;
	windows?: WindowState[];
	wmGroup?: string;
	extraItems?: ContextMenuEntry[];
}

export function useContextMenuItems({
	scope,
	appId,
	windowId,
	instanceKey,
	window,
	windows,
	wmGroup,
	extraItems,
}: UseContextMenuItemsOptions): ContextMenuEntry[] {
	const manifest = AppRegistry.get(appId);

	return useMemo((): ContextMenuEntry[] => {
		if (!manifest) {
			return extraItems ?? [];
		}

		const context: ContextMenuContext = {
			scope,
			appId,
			manifest,
			windowId,
			instanceKey,
			window,
			windows,
			wmGroup,
		};

		const items = resolveContextMenuItems(scope, context, manifest);
		if (!extraItems?.length) {
			return items;
		}

		const divider: ContextMenuDividerDef = { type: 'divider', id: 'local' };
		return [...items, divider, ...extraItems];
	}, [
		appId,
		extraItems,
		instanceKey,
		manifest,
		scope,
		window,
		windowId,
		windows,
		wmGroup,
	]);
}

export function useAppWindowContextMenu(extraItems?: ContextMenuEntry[]) {
	const { appId, windowId, instanceKey, manifest } = useAppContext();
	const window = useWmStore((state) => state.windows[windowId]);

	return useContextMenuItems({
		scope: 'window',
		appId,
		windowId,
		instanceKey,
		window,
		extraItems,
	});
}

export function useAppContextMenuContext(): ContextMenuContext {
	const { appId, windowId, instanceKey, manifest } = useAppContext();
	const window = useWmStore((state) => state.windows[windowId]);

	return {
		scope: 'window',
		appId,
		manifest,
		windowId,
		instanceKey,
		window,
	};
}
