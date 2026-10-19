import { useMemo, type ReactNode } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import type { WindowState } from '@/core/windowManager/types';

import { ContextMenu } from './ContextMenu';
import { useContextMenuItems } from './useContextMenuItems';

interface WindowContextMenuProps {
	windowId: string;
	windowState: WindowState;
	children: ReactNode;
}

export function WindowContextMenu({ windowId, windowState, children }: WindowContextMenuProps) {
	const manifest = AppRegistry.get(windowState.appId);
	const { appId, instanceKey, title, minimized, maximized, props } = windowState;
	// Geometry and zIndex change on every drag/focus; menu items depend only on these fields.
	const menuWindow = useMemo(() => windowState, [appId, instanceKey, title, minimized, maximized, props]);
	const items = useContextMenuItems({
		scope: 'window',
		appId,
		windowId,
		instanceKey,
		window: menuWindow,
	});

	const context = useMemo(
		() => ({
			scope: 'window' as const,
			appId,
			manifest: manifest!,
			windowId,
			instanceKey,
			window: menuWindow,
		}),
		[manifest, windowId, appId, instanceKey, menuWindow],
	);

	if (!manifest) {
		return <>{children}</>;
	}

	return (
		<ContextMenu items={items} context={context}>
			{children}
		</ContextMenu>
	);
}
