import { Box } from '@mantine/core';
import { useMemo, type ReactNode } from 'react';

import { getVisibleContextMenuItems } from './resolveMenuItems';
import type { ContextMenuContext, ContextMenuEntry } from './types';
import { isContextMenuDivider } from './types';
import { useContextMenuAnchor } from './useContextMenuAnchor';

interface ContextMenuProps {
	items: ContextMenuEntry[];
	context: ContextMenuContext;
	children: ReactNode;
	position?: 'bottom' | 'top';
	zIndex?: number;
}

export function ContextMenu({
	items,
	context,
	children,
	position = 'bottom',
	zIndex = 1200,
}: ContextMenuProps) {
	const visibleItems = useMemo(() => getVisibleContextMenuItems(items), [items]);
	const hasEntries = useMemo(
		() => items.some((entry) => isContextMenuDivider(entry) || !entry.hidden),
		[items],
	);
	const { onContextMenu, menu } = useContextMenuAnchor(items, context, { position, zIndex });

	if (!hasEntries || visibleItems.length === 0) {
		return <>{children}</>;
	}

	return (
		<>
			<Box component="span" style={{ display: 'contents' }} onContextMenu={onContextMenu}>
				{children}
			</Box>
			{menu}
		</>
	);
}
