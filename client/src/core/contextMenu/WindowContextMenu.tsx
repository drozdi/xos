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
	const items = useContextMenuItems({
		scope: 'window',
		appId: windowState.appId,
		windowId,
		instanceKey: windowState.instanceKey,
		window: windowState,
	});

	const context = useMemo(
		() => ({
			scope: 'window' as const,
			appId: windowState.appId,
			manifest: manifest!,
			windowId,
			instanceKey: windowState.instanceKey,
			window: windowState,
		}),
		[manifest, windowId, windowState],
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
